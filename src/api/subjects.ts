import { useMutation, useQueryClient } from '@tanstack/react-query';

import { readSubjectDetail, readSubjects, writeSubjectDetail, writeSubjects } from '@/db/cache';
import { useCachedQuery } from '@/db/cached-query';
import { api } from '@/lib/api';
import type { Subject, SubjectColor, SubjectDetail } from './types';

export type CreateSubjectInput = {
  name: string;
  code?: string;
  description?: string;
  color?: SubjectColor;
  progress?: number;
};
export type UpdateSubjectInput = Partial<CreateSubjectInput>;

export const subjectKeys = {
  all: ['subjects'] as const,
  detail: (id: string) => ['subjects', id] as const,
};

export function useSubjects() {
  return useCachedQuery({
    queryKey: subjectKeys.all,
    fetcher: () => api.get<Subject[]>('/api/subjects'),
    readCache: readSubjects,
    writeCache: writeSubjects,
  });
}

export function useSubject(id: string) {
  return useCachedQuery({
    queryKey: subjectKeys.detail(id),
    fetcher: () => api.get<SubjectDetail>(`/api/subjects/${id}`),
    readCache: () => readSubjectDetail(id),
    writeCache: writeSubjectDetail,
    enabled: !!id,
  });
}

export function useCreateSubject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateSubjectInput) => api.post<Subject>('/api/subjects', input),
    onSuccess: () => qc.invalidateQueries({ queryKey: subjectKeys.all }),
  });
}

export function useUpdateSubject(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateSubjectInput) => api.patch<Subject>(`/api/subjects/${id}`, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: subjectKeys.all });
      qc.invalidateQueries({ queryKey: subjectKeys.detail(id) });
    },
  });
}

export function useDeleteSubject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/subjects/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: subjectKeys.all }),
  });
}
