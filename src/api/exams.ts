import { useMutation, useQueryClient } from '@tanstack/react-query';

import {
  enqueuePendingExam,
  gradeExamLocally,
  readExamDetail,
  readExams,
  writeExamDetail,
  writeExams,
} from '@/db/cache';
import { useCachedQuery } from '@/db/cached-query';
import { api, NetworkError } from '@/lib/api';
import { subjectKeys } from './subjects';
import type { Exam, ExamDetail, ExamSubmissionPayload } from './types';

export type CreateExamInput = {
  subjectId: string;
  name: string;
  date?: string;
  questionCount?: number;
};

export type SubmitExamInput = ExamSubmissionPayload;

export const examKeys = {
  all: ['exams'] as const,
  detail: (id: string) => ['exams', id] as const,
};

export function useExams() {
  return useCachedQuery({
    queryKey: examKeys.all,
    fetcher: () => api.get<Exam[]>('/api/exams'),
    readCache: readExams,
    writeCache: writeExams,
  });
}

export function useExam(id: string) {
  return useCachedQuery({
    queryKey: examKeys.detail(id),
    fetcher: () => api.get<ExamDetail>(`/api/exams/${id}`),
    readCache: () => readExamDetail(id),
    writeCache: writeExamDetail,
    enabled: !!id,
  });
}

export function useCreateExam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateExamInput) => api.post<ExamDetail>('/api/exams', input),
    onSuccess: (exam) => {
      qc.invalidateQueries({ queryKey: examKeys.all });
      qc.invalidateQueries({ queryKey: subjectKeys.detail(exam.subjectId) });
      qc.invalidateQueries({ queryKey: subjectKeys.all });
    },
  });
}

export function useSubmitExam(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: SubmitExamInput): Promise<ExamDetail> => {
      try {
        const exam = await api.post<ExamDetail>(`/api/exams/${id}/submit`, input);
        writeExamDetail(exam);
        return exam;
      } catch (err) {
        // Offline: grade against the cached question set and queue the real submit
        // for `useExamSync` to replay on reconnect. If the exam isn't cached there's
        // nothing to grade locally, so surface the original error.
        if (!(err instanceof NetworkError)) throw err;
        const graded = gradeExamLocally(id, input);
        if (!graded) throw err;
        enqueuePendingExam(id, input);
        return graded;
      }
    },
    onSuccess: (exam) => {
      qc.invalidateQueries({ queryKey: examKeys.all });
      qc.invalidateQueries({ queryKey: examKeys.detail(id) });
      qc.invalidateQueries({ queryKey: subjectKeys.detail(exam.subjectId) });
    },
  });
}

export function useDeleteExam(subjectId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/exams/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: examKeys.all });
      if (subjectId) qc.invalidateQueries({ queryKey: subjectKeys.detail(subjectId) });
      qc.invalidateQueries({ queryKey: subjectKeys.all });
    },
  });
}
