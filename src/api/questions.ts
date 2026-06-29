import { readSubjectQuestions, writeSubjectQuestions } from '@/db/cache';
import { useCachedQuery } from '@/db/cached-query';
import { api } from '@/lib/api';
import type { Question } from './types';

export const questionKeys = {
  bySubject: (subjectId: string) => ['questions', { subjectId }] as const,
};

/** The reusable question bank for a subject (the pool exams draw from). */
export function useSubjectQuestions(subjectId: string) {
  return useCachedQuery({
    queryKey: questionKeys.bySubject(subjectId),
    fetcher: () => api.get<Question[]>(`/api/subjects/${subjectId}/questions`),
    readCache: () => readSubjectQuestions(subjectId),
    writeCache: (list) => writeSubjectQuestions(subjectId, list),
    enabled: !!subjectId,
  });
}
