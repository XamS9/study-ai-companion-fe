import { eq, notInArray } from 'drizzle-orm';

import type {
  Activity,
  Dashboard,
  Exam,
  ExamDetail,
  ExamSubmissionPayload,
  Flashcard,
  Material,
  Question,
  Stats,
  Subject,
  SubjectDetail,
} from '@/api/types';

import { db } from './client';
import {
  appCache,
  examQuestions,
  exams,
  flashcards,
  materials,
  pendingExamSubmissions,
  subjects,
} from './schema';

/**
 * Read-through cache helpers backing the React Query hooks in `@/api`. Reads are
 * synchronous (expo-sqlite sync driver) so they can feed `initialData`; a read
 * that finds nothing returns `undefined` so the hook falls through to the network
 * instead of rendering an empty result as if it were real data.
 *
 * Every DB call is wrapped: a read failure yields `undefined` (network-only) and
 * a write failure is swallowed. The cache must never crash a screen — losing it
 * just means losing offline support, not the app.
 */

function safeRead<T>(fn: () => T | undefined): T | undefined {
  try {
    return fn();
  } catch (err) {
    console.warn('[db] cache read failed', err);
    return undefined;
  }
}

function safeWrite(fn: () => void): void {
  try {
    fn();
  } catch (err) {
    console.warn('[db] cache write failed', err);
  }
}

// ── Subjects ────────────────────────────────────────────────────────────────

export function readSubjects(): Subject[] | undefined {
  return safeRead(() => {
    const rows = db.select().from(subjects).all();
    return rows.length ? rows : undefined;
  });
}

export function writeSubjects(list: Subject[]): void {
  safeWrite(() => {
    const ids = list.map((s) => s.id);
    // Replace the full set so server-side deletions propagate to the cache.
    if (ids.length) db.delete(subjects).where(notInArray(subjects.id, ids)).run();
    else db.delete(subjects).run();
    for (const s of list) {
      db.insert(subjects).values(s).onConflictDoUpdate({ target: subjects.id, set: s }).run();
    }
  });
}

export function readSubjectDetail(id: string): SubjectDetail | undefined {
  return safeRead(() => {
    const subject = db.select().from(subjects).where(eq(subjects.id, id)).get();
    if (!subject) return undefined;
    const mats = db.select().from(materials).where(eq(materials.subjectId, id)).all();
    const exs = db.select().from(exams).where(eq(exams.subjectId, id)).all();
    return { ...subject, materials: mats, exams: exs };
  });
}

export function writeSubjectDetail(detail: SubjectDetail): void {
  safeWrite(() => {
    const { materials: mats, exams: exs, ...subject } = detail;
    db.insert(subjects).values(subject).onConflictDoUpdate({ target: subjects.id, set: subject }).run();
    // Replace this subject's children wholesale; other subjects are untouched.
    db.delete(materials).where(eq(materials.subjectId, detail.id)).run();
    for (const m of mats) db.insert(materials).values(m).run();
    db.delete(exams).where(eq(exams.subjectId, detail.id)).run();
    for (const e of exs) db.insert(exams).values(e).run();
  });
}

// ── Materials ───────────────────────────────────────────────────────────────

export function readMaterial(id: string): Material | undefined {
  return safeRead(() => db.select().from(materials).where(eq(materials.id, id)).get());
}

export function writeMaterial(material: Material): void {
  safeWrite(() => {
    db.insert(materials).values(material).onConflictDoUpdate({ target: materials.id, set: material }).run();
  });
}

export function readFlashcards(materialId: string): Flashcard[] | undefined {
  return safeRead(() => {
    const rows = db.select().from(flashcards).where(eq(flashcards.materialId, materialId)).all();
    return rows.length ? rows.map(({ id, front, back }) => ({ id, front, back })) : undefined;
  });
}

export function writeFlashcards(materialId: string, list: Flashcard[]): void {
  safeWrite(() => {
    db.delete(flashcards).where(eq(flashcards.materialId, materialId)).run();
    for (const f of list) db.insert(flashcards).values({ ...f, materialId }).run();
  });
}

// ── Exams ───────────────────────────────────────────────────────────────────

export function readExams(): Exam[] | undefined {
  return safeRead(() => {
    const rows = db.select().from(exams).all();
    return rows.length ? rows : undefined;
  });
}

export function writeExams(list: Exam[]): void {
  safeWrite(() => {
    const ids = list.map((e) => e.id);
    if (ids.length) db.delete(exams).where(notInArray(exams.id, ids)).run();
    else db.delete(exams).run();
    for (const e of list) {
      db.insert(exams).values(e).onConflictDoUpdate({ target: exams.id, set: e }).run();
    }
  });
}

export function readExamDetail(id: string): ExamDetail | undefined {
  return safeRead(() => {
    const exam = db.select().from(exams).where(eq(exams.id, id)).get();
    if (!exam) return undefined;
    const rows = db
      .select()
      .from(examQuestions)
      .where(eq(examQuestions.examId, id))
      .orderBy(examQuestions.position)
      .all();
    const questions = rows.map(({ examId: _examId, ...q }) => q);
    return { ...exam, questions };
  });
}

export function writeExamDetail(detail: ExamDetail): void {
  safeWrite(() => {
    const { questions, ...exam } = detail;
    db.insert(exams).values(exam).onConflictDoUpdate({ target: exams.id, set: exam }).run();
    db.delete(examQuestions).where(eq(examQuestions.examId, detail.id)).run();
    for (const q of questions) db.insert(examQuestions).values({ ...q, examId: detail.id }).run();
  });
}

// ── Offline exam grading + submission queue ──────────────────────────────────

const normalizeAnswer = (s: string) => s.trim().toLowerCase();

/**
 * Grades an exam attempt against the locally-cached question set (which carries
 * each question's `correctAnswer`) and writes the graded detail back to the
 * cache, mirroring what the server's submit would return. Returns the graded
 * detail, or `undefined` if the exam isn't cached (nothing to grade offline).
 *
 * Grading matches the backend exactly: case/whitespace-insensitive answer compare,
 * score = round(correct / total * 100).
 */
export function gradeExamLocally(
  examId: string,
  payload: ExamSubmissionPayload,
): ExamDetail | undefined {
  const exam = readExamDetail(examId);
  if (!exam) return undefined;

  const given = new Map(payload.answers.map((a) => [a.examQuestionId, a.answer]));
  let correct = 0;
  const questions = exam.questions.map((q) => {
    const userAnswer = given.get(q.id) ?? null;
    const isCorrect =
      userAnswer != null && normalizeAnswer(userAnswer) === normalizeAnswer(q.correctAnswer);
    if (isCorrect) correct += 1;
    return { ...q, userAnswer, isCorrect };
  });

  const total = questions.length;
  const graded: ExamDetail = {
    ...exam,
    score: total > 0 ? Math.round((correct / total) * 100) : 0,
    correctCount: correct,
    totalCount: total,
    timeElapsedSeconds: payload.timeElapsedSeconds ?? null,
    date: new Date().toISOString(),
    questions,
  };
  writeExamDetail(graded);
  return graded;
}

export function enqueuePendingExam(examId: string, payload: ExamSubmissionPayload): void {
  safeWrite(() => {
    const row = { examId, payload, createdAt: Date.now() };
    db.insert(pendingExamSubmissions)
      .values(row)
      .onConflictDoUpdate({ target: pendingExamSubmissions.examId, set: row })
      .run();
  });
}

export function readPendingExams(): { examId: string; payload: ExamSubmissionPayload }[] {
  return (
    safeRead(() => {
      const rows = db.select().from(pendingExamSubmissions).all();
      return rows.map((r) => ({ examId: r.examId, payload: r.payload }));
    }) ?? []
  );
}

export function deletePendingExam(examId: string): void {
  safeWrite(() => {
    db.delete(pendingExamSubmissions).where(eq(pendingExamSubmissions.examId, examId)).run();
  });
}

// ── Dashboard (derived aggregate, stored as a single JSON blob) ──────────────

const DASHBOARD_KEY = 'dashboard';

export function readDashboard(): Dashboard | undefined {
  return safeRead(() => {
    const row = db.select().from(appCache).where(eq(appCache.key, DASHBOARD_KEY)).get();
    return row ? (row.value as Dashboard) : undefined;
  });
}

export function writeDashboard(dashboard: Dashboard): void {
  safeWrite(() => {
    const row = { key: DASHBOARD_KEY, value: dashboard, updatedAt: Date.now() };
    db.insert(appCache).values(row).onConflictDoUpdate({ target: appCache.key, set: row }).run();
  });
}

// ── Stats (derived academic aggregate, stored as a single JSON blob) ──────────

const STATS_KEY = 'stats';

export function readStats(): Stats | undefined {
  return safeRead(() => {
    const row = db.select().from(appCache).where(eq(appCache.key, STATS_KEY)).get();
    return row ? (row.value as Stats) : undefined;
  });
}

export function writeStats(stats: Stats): void {
  safeWrite(() => {
    const row = { key: STATS_KEY, value: stats, updatedAt: Date.now() };
    db.insert(appCache).values(row).onConflictDoUpdate({ target: appCache.key, set: row }).run();
  });
}

// ── Question bank per subject (stored as a JSON blob keyed by subject) ─────────

const questionsKey = (subjectId: string) => `questions:${subjectId}`;

export function readSubjectQuestions(subjectId: string): Question[] | undefined {
  return safeRead(() => {
    const row = db.select().from(appCache).where(eq(appCache.key, questionsKey(subjectId))).get();
    return row ? (row.value as Question[]) : undefined;
  });
}

export function writeSubjectQuestions(subjectId: string, list: Question[]): void {
  safeWrite(() => {
    const row = { key: questionsKey(subjectId), value: list, updatedAt: Date.now() };
    db.insert(appCache).values(row).onConflictDoUpdate({ target: appCache.key, set: row }).run();
  });
}

// ── Cache wipe (on sign-out) ─────────────────────────────────────────────────

/** Deletes every cached row so a new user never sees a previous user's data. */
export function clearAllCache(): void {
  safeWrite(() => {
    db.delete(subjects).run();
    db.delete(materials).run();
    db.delete(flashcards).run();
    db.delete(exams).run();
    db.delete(examQuestions).run();
    db.delete(pendingExamSubmissions).run();
    db.delete(appCache).run();
  });
}

// ── Activity feed (derived list, stored as a single JSON blob) ────────────────

const ACTIVITY_KEY = 'activity';

export function readActivity(): Activity[] | undefined {
  return safeRead(() => {
    const row = db.select().from(appCache).where(eq(appCache.key, ACTIVITY_KEY)).get();
    return row ? (row.value as Activity[]) : undefined;
  });
}

export function writeActivity(list: Activity[]): void {
  safeWrite(() => {
    const row = { key: ACTIVITY_KEY, value: list, updatedAt: Date.now() };
    db.insert(appCache).values(row).onConflictDoUpdate({ target: appCache.key, set: row }).run();
  });
}
