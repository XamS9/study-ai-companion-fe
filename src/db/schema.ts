import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import type {
  ExamSubmissionPayload,
  MaterialType,
  QuestionType,
  SubjectColor,
} from '@/api/types';

/**
 * On-device SQLite schema (expo-sqlite + Drizzle). These tables are a local
 * read-through cache of the Express backend, not a separate source of truth:
 * screens hydrate from here instantly and offline, and every successful network
 * response is written back. Columns mirror the API shapes in `@/api/types` so
 * rows round-trip without lossy transforms. Dates stay as the backend's ISO
 * strings; JSON-ish fields (string arrays) use Drizzle's `json` text mode.
 *
 * Drizzle migrations are generated from this file (`pnpm db:generate`) and
 * applied on-device at boot — see `src/db/provider.tsx`.
 */

export const subjects = sqliteTable('subjects', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  code: text('code'),
  description: text('description'),
  color: text('color').$type<SubjectColor>().notNull(),
  progress: real('progress').notNull(),
  materialsCount: integer('materials_count').notNull(),
  examsCount: integer('exams_count').notNull(),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const materials = sqliteTable('materials', {
  id: text('id').primaryKey(),
  subjectId: text('subject_id').notNull(),
  title: text('title').notNull(),
  type: text('type').$type<MaterialType>().notNull(),
  pages: integer('pages'),
  content: text('content'),
  summary: text('summary'),
  keyConcepts: text('key_concepts', { mode: 'json' }).$type<string[]>().notNull(),
  fileUrl: text('file_url'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const flashcards = sqliteTable('flashcards', {
  id: text('id').primaryKey(),
  materialId: text('material_id').notNull(),
  front: text('front').notNull(),
  back: text('back').notNull(),
});

export const exams = sqliteTable('exams', {
  id: text('id').primaryKey(),
  subjectId: text('subject_id').notNull(),
  name: text('name').notNull(),
  date: text('date').notNull(),
  score: integer('score'),
  correctCount: integer('correct_count'),
  totalCount: integer('total_count').notNull(),
  timeElapsedSeconds: integer('time_elapsed_seconds'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const examQuestions = sqliteTable('exam_questions', {
  id: text('id').primaryKey(),
  examId: text('exam_id').notNull(),
  prompt: text('prompt').notNull(),
  type: text('type').$type<QuestionType>().notNull(),
  options: text('options', { mode: 'json' }).$type<string[]>().notNull(),
  correctAnswer: text('correct_answer').notNull(),
  userAnswer: text('user_answer'),
  // SQLite has no boolean; Drizzle maps integer 0/1 ↔ boolean. Nullable until graded.
  isCorrect: integer('is_correct', { mode: 'boolean' }),
  position: integer('position').notNull(),
});

/**
 * Key/value store for derived payloads that aren't a single table row — e.g. the
 * dashboard aggregate. Value is the raw JSON the backend returned.
 */
export const appCache = sqliteTable('app_cache', {
  key: text('key').primaryKey(),
  value: text('value', { mode: 'json' }).notNull(),
  updatedAt: integer('updated_at').notNull(),
});

/**
 * Outbox for exam submissions taken offline. The attempt is graded locally and
 * written to the cache immediately; this row holds the raw payload so the real
 * server submit can be replayed once connectivity returns (see `@/lib/exam-sync`).
 * Keyed by examId — a single-attempt exam can have at most one pending submission.
 */
export const pendingExamSubmissions = sqliteTable('pending_exam_submissions', {
  examId: text('exam_id').primaryKey(),
  payload: text('payload', { mode: 'json' }).$type<ExamSubmissionPayload>().notNull(),
  createdAt: integer('created_at').notNull(),
});
