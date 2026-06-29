import type { ExamDetail } from '@/api/types';
import { deletePendingExam, readPendingExams, writeExamDetail } from '@/db/cache';
import { api, NetworkError } from '@/lib/api';

/**
 * Replays exam submissions that were taken offline (queued by `useSubmitExam`).
 * For each queued attempt it posts to the real submit endpoint, writes the
 * authoritative server result back to the cache, and drops it from the queue.
 *
 * On a `NetworkError` we're still offline — stop and leave the rest queued for the
 * next attempt. A non-network error (e.g. the exam was deleted server-side, 404)
 * is terminal for that item, so we drop it to avoid a poison-message loop.
 *
 * Returns the list of exams successfully synced (so the caller can refresh them).
 */
export async function flushPendingExams(): Promise<ExamDetail[]> {
  const pending = readPendingExams();
  const synced: ExamDetail[] = [];

  for (const item of pending) {
    try {
      const exam = await api.post<ExamDetail>(`/api/exams/${item.examId}/submit`, item.payload);
      writeExamDetail(exam);
      deletePendingExam(item.examId);
      synced.push(exam);
    } catch (err) {
      if (err instanceof NetworkError) break;
      // Terminal failure for this attempt — discard so it can't block the queue.
      deletePendingExam(item.examId);
    }
  }

  return synced;
}
