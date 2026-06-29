import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { useStats } from '@/api/dashboard';
import type { SubjectStats } from '@/api/types';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AsyncContent } from '@/components/ui/async-content';
import { Screen } from '@/components/ui/screen';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatStudyTime } from '@/lib/format';
import { scoreColorKey } from '@/lib/score';

const dash = (value: number | null, suffix = '') => (value == null ? '—' : `${value}${suffix}`);

export default function StatsScreen() {
  const { t } = useTranslation();
  const { data: stats, isLoading, error, refetch } = useStats();

  return (
    <Screen>
      <AsyncContent
        isLoading={isLoading}
        error={error as Error | null}
        isEmpty={stats ? stats.examsTaken === 0 : false}
        emptyText={t('stats.empty')}
        onRetry={refetch}
      >
        {stats ? (
          <>
            <View style={styles.grid}>
              <StatCard label={t('stats.examsTaken')} value={String(stats.examsTaken)} />
              <StatCard label={t('stats.average')} value={dash(stats.averageScore, '%')} />
              <StatCard label={t('stats.best')} value={dash(stats.bestScore, '%')} />
              <StatCard label={t('stats.worst')} value={dash(stats.worstScore, '%')} />
            </View>

            <ThemedView type="backgroundElement" style={styles.timeCard}>
              <ThemedText type="small" themeColor="textSecondary">
                {t('stats.totalStudyTime')}
              </ThemedText>
              <ThemedText type="subtitle">
                {formatStudyTime(stats.totalStudyTimeSeconds)}
              </ThemedText>
            </ThemedView>

            {stats.perSubject.length > 0 ? (
              <View style={styles.section}>
                <ThemedText type="smallBold">{t('stats.bySubject')}</ThemedText>
                <View style={styles.list}>
                  {stats.perSubject.map((s) => (
                    <SubjectRow key={s.subjectId} stats={s} />
                  ))}
                </View>
              </View>
            ) : null}
          </>
        ) : null}
      </AsyncContent>
    </Screen>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <ThemedText type="title" style={styles.cardValue}>
        {value}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
    </ThemedView>
  );
}

function SubjectRow({ stats }: { stats: SubjectStats }) {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <ThemedView type="backgroundElement" style={styles.row}>
      <View style={[styles.swatch, { backgroundColor: theme[stats.color] }]} />
      <View style={styles.rowText}>
        <ThemedText type="smallBold">{stats.subject}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {t('stats.subjectMeta', {
            count: stats.examsTaken,
            best: dash(stats.bestScore, '%'),
            worst: dash(stats.worstScore, '%'),
            time: formatStudyTime(stats.totalStudyTimeSeconds),
          })}
        </ThemedText>
      </View>
      <ThemedText
        type="smallBold"
        style={{ color: stats.averageScore == null ? theme.textSecondary : theme[scoreColorKey(stats.averageScore)] }}
      >
        {dash(stats.averageScore, '%')}
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  card: {
    flexGrow: 1,
    flexBasis: '47%',
    alignItems: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.three,
  },
  cardValue: { fontSize: 36, lineHeight: 40 },
  timeCard: { gap: Spacing.one, padding: Spacing.three, borderRadius: Spacing.three },
  section: { gap: Spacing.two },
  list: { gap: Spacing.two },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
  swatch: { width: 12, height: 36, borderRadius: 6 },
  rowText: { flex: 1, gap: Spacing.half },
});
