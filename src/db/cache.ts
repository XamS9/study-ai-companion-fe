import { eq, notInArray } from 'drizzle-orm';

import type {
  Dashboard,
  Exam,
  ExamDetail,
  Flashcard,
  Material,
  Subject,
  SubjectDetail,
} from '@/api/types';

import { db } from './client';
import { appCache, examQuestions, exams, flashcards, materials, subjects } from './schema';

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
