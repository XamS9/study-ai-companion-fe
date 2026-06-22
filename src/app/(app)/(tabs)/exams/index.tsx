import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { useExams } from '@/api/exams';
import { useSubjects } from '@/api/subjects';
import type { Exam, Subject } from '@/api/types';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AsyncContent } from '@/components/ui/async-content';
import { Button } from '@/components/ui/button';
import { FilterPills } from '@/components/ui/filter-pills';
import { Screen } from '@/components/ui/screen';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { scoreColorKey } from '@/lib/score';

type Filter = 'all' | 'upcoming' | 'completed';
const FILTERS: Filter[] = ['all', 'upcoming', 'completed'];

export default function ExamsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>('all');
  const { data: examData, isLoading, error, refetch } = useExams();
  const { data: subjectData } = useSubjects();

  const subjectsById = useMemo(
    () => new Map((subjectData ?? []).map((s) => [s.id, s])),
    [subjectData],
  );

  const exams = useMemo(() => {
    return (examData ?? []).filter((e) => {
      if (filter === 'upcoming') return e.score === null;
      if (filter === 'completed') return e.score !== null;
      return true;
    });
  }, [examData, filter]);

  return (
    <Screen>
      <View style={styles.headerRow}>
        <ThemedText type="subtitle">{t('exams.title')}</ThemedText>
        <Button title={t('exams.new.create')} onPress={() => router.push('/exams/new')} />
      </View>

      <FilterPills value={filter} options={FILTERS} onChange={setFilter} tPrefix="exams.filter" />

      <AsyncContent
        isLoading={isLoading}
        error={error as Error | null}
        isEmpty={exams.length === 0}
        emptyText={t('exams.empty')}
        onRetry={refetch}
      >
        <View style={styles.list}>
          {exams.map((e) => (
            <ExamCard key={e.id} exam={e} subject={subjectsById.get(e.subjectId)} />
          ))}
        </View>
      </AsyncContent>
    </Screen>
  );
}

function ExamCard({ exam, subject }: { exam: Exam; subject?: Subject }) {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const swatch = theme[subject?.color ?? 'primary'];
  const date = new Intl.DateTimeFormat(i18n.language, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(exam.date));

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push({ pathname: '/exams/[id]', params: { id: exam.id } })}
    >
      <ThemedView type="backgroundElement" style={styles.card}>
        <View style={[styles.swatch, { backgroundColor: `${swatch}55` }]} />
        <View style={styles.cardText}>
          <ThemedText type="smallBold">{exam.name}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {subject?.name ? `${subject.name} · ` : ''}
            {date}
          </ThemedText>
        </View>
        {exam.score === null ? (
          <View style={[styles.badge, { borderColor: theme.primary }]}>
            <ThemedText type="small" style={{ color: theme.primary }}>
              {t('exams.upcoming')}
            </ThemedText>
          </View>
        ) : (
          <ThemedText type="smallBold" style={{ color: theme[scoreColorKey(exam.score)] }}>
            {exam.score}%
          </ThemedText>
        )}
      </ThemedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  list: { gap: Spacing.two },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
  swatch: { width: 48, height: 48, borderRadius: Spacing.two },
  cardText: { flex: 1, gap: Spacing.half },
  badge: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: 999,
    borderWidth: 1,
  },
});
