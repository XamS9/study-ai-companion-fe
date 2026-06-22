import { useMutation, useQueryClient } from '@tanstack/react-query';

import { readExamDetail, readExams, writeExamDetail, writeExams } from '@/db/cache';
import { useCachedQuery } from '@/db/cached-query';
import { api } from '@/lib/api';
import { subjectKeys } from './subjects';
import type { Exam, ExamDetail } from './types';

export type CreateExamInput = {
  subjectId: string;
  name: string;
  date?: string;
  questionCount?: number;
};

export type SubmitExamInput = {
  timeElapsedSeconds?: number;
  answers: { examQuestionId: string; answer: string }[];
};

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
    mutationFn: (input: SubmitExamInput) => api.post<ExamDetail>(`/api/exams/${id}/submit`, input),
    onSuccess: (exam) => {
      qc.invalidateQueries({ queryKey: examKeys.all });
      qc.invalidateQueries({ queryKey: examKeys.detail(id) });
      qc.invalidateQueries({ queryKey: subjectKeys.detail(exam.subjectId) });
    },
  });
}

export function useDeleteExam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/exams/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: examKeys.all }),
  });
}
