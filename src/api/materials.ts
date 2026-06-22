import { useMutation, useQueryClient } from '@tanstack/react-query';

import { readFlashcards, readMaterial, writeFlashcards, writeMaterial } from '@/db/cache';
import { useCachedQuery } from '@/db/cached-query';
import { api } from '@/lib/api';
import { subjectKeys } from './subjects';
import type { Flashcard, Material, MaterialType } from './types';

export type CreateMaterialInput = {
  subjectId: string;
  title: string;
  type: MaterialType;
  pages?: number | null;
  content?: string;
  fileUrl?: string;
};

export const materialKeys = {
  all: ['materials'] as const,
  bySubject: (subjectId: string) => ['materials', { subjectId }] as const,
  detail: (id: string) => ['materials', id] as const,
  flashcards: (id: string) => ['materials', id, 'flashcards'] as const,
};

export function useMaterial(id: string) {
  return useCachedQuery({
    queryKey: materialKeys.detail(id),
    fetcher: () => api.get<Material>(`/api/materials/${id}`),
    readCache: () => readMaterial(id),
    writeCache: writeMaterial,
    enabled: !!id,
  });
}

export function useFlashcards(materialId: string) {
  return useCachedQuery({
    queryKey: materialKeys.flashcards(materialId),
    fetcher: () => api.get<Flashcard[]>(`/api/materials/${materialId}/flashcards`),
    readCache: () => readFlashcards(materialId),
    writeCache: (list) => writeFlashcards(materialId, list),
    enabled: !!materialId,
  });
}

export function useCreateMaterial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateMaterialInput) => api.post<Material>('/api/materials', input),
    onSuccess: (material) => {
      qc.invalidateQueries({ queryKey: materialKeys.all });
      qc.invalidateQueries({ queryKey: subjectKeys.detail(material.subjectId) });
      qc.invalidateQueries({ queryKey: subjectKeys.all });
    },
  });
}

export function useDeleteMaterial(subjectId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/materials/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: materialKeys.all });
      if (subjectId) qc.invalidateQueries({ queryKey: subjectKeys.detail(subjectId) });
      qc.invalidateQueries({ queryKey: subjectKeys.all });
    },
  });
}
