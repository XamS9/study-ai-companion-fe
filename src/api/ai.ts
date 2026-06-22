import { useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api';
import { materialKeys } from './materials';
import { subjectKeys } from './subjects';
import type { QuestionType } from './types';

export type GeneratedQuestion = {
  prompt: string;
  type: QuestionType;
  options: string[];
  correctAnswer: string;
};

export type GenerateQuestionsInput = {
  subjectId: string;
  materialId?: string;
  sourceText?: string;
  count?: number;
  persist?: boolean;
};

export type SummarizeInput = {
  materialId?: string;
  text?: string;
  persist?: boolean;
};

export function useGenerateQuestions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: GenerateQuestionsInput) =>
      api.post<{ questions: GeneratedQuestion[] }>('/api/ai/generate-questions', input),
    onSuccess: () => qc.invalidateQueries({ queryKey: subjectKeys.all }),
  });
}

export function useSummarizeMaterial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: SummarizeInput) => api.post<{ summary: string }>('/api/ai/summarize', input),
    onSuccess: (_data, input) => {
      if (input.materialId) qc.invalidateQueries({ queryKey: materialKeys.detail(input.materialId) });
    },
  });
}

export type ProcessMaterialResult = {
  summary: string;
  keyConcepts: string[];
  flashcardsCount: number;
  questionsCount: number;
};

export function useProcessMaterial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { materialId: string; questionCount?: number; flashcardCount?: number }) =>
      api.post<ProcessMaterialResult>('/api/ai/process-material', input),
    onSuccess: (_data, input) => {
      qc.invalidateQueries({ queryKey: materialKeys.detail(input.materialId) });
      qc.invalidateQueries({ queryKey: materialKeys.flashcards(input.materialId) });
      qc.invalidateQueries({ queryKey: subjectKeys.all });
    },
  });
}
