import NetInfo from '@react-native-community/netinfo';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { examKeys } from '@/api/exams';
import { subjectKeys } from '@/api/subjects';
import { flushPendingExams } from '@/lib/exam-sync';

/**
 * Drains the offline exam-submission queue on mount and whenever connectivity is
 * regained, then invalidates the affected React Query caches so screens refresh
 * with the authoritative server result. Mount once, inside the providers.
 */
export function useExamSync(): void {
  const qc = useQueryClient();

  useEffect(() => {
    let running = false;
    const run = async () => {
      if (running) return;
      running = true;
      try {
        const synced = await flushPendingExams();
        if (synced.length > 0) {
          qc.invalidateQueries({ queryKey: examKeys.all });
          for (const exam of synced) {
            qc.invalidateQueries({ queryKey: examKeys.detail(exam.id) });
            qc.invalidateQueries({ queryKey: subjectKeys.detail(exam.subjectId) });
          }
          qc.invalidateQueries({ queryKey: subjectKeys.all });
        }
      } finally {
        running = false;
      }
    };

    void run();
    const unsubscribe = NetInfo.addEventListener((state) => {
      if (state.isConnected) void run();
    });
    return unsubscribe;
  }, [qc]);
}
