import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { useActivity } from '@/api/dashboard';
import type { Activity, ActivityType } from '@/api/types';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AsyncContent } from '@/components/ui/async-content';
import { Screen } from '@/components/ui/screen';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const TYPE_GLYPH: Record<ActivityType, string> = { exam: '✎', material: '◫', subject: '＋' };
const TYPE_COLOR: Record<ActivityType, 'success' | 'accent' | 'primary'> = {
  exam: 'success',
  material: 'accent',
  subject: 'primary',
};

export default function HistoryScreen() {
  const { t } = useTranslation();
  const { data, isLoading, error, refetch } = useActivity();
  const activity = data ?? [];
  // Snapshot "now" once at mount so relative times stay pure during render (the
  // React Compiler forbids calling Date.now() in the render body).
  const [now] = useState(() => Date.now());

  return (
    <Screen>
      <ThemedText type="subtitle">{t('history.title')}</ThemedText>

      <AsyncContent
        isLoading={isLoading}
        error={error as Error | null}
        isEmpty={activity.length === 0}
        emptyText={t('history.empty')}
        onRetry={refetch}
      >
        <View style={styles.list}>
          {activity.map((a) => (
            <ActivityRow key={a.id} activity={a} now={now} />
          ))}
        </View>
      </AsyncContent>
    </Screen>
  );
}

/**
 * Localized "x hours ago" using the coarsest sensible unit. Built on i18next
 * plurals rather than `Intl.RelativeTimeFormat` — Hermes (RN's JS engine) ships
 * `Intl.DateTimeFormat`/`NumberFormat` but not `RelativeTimeFormat`, so using it
 * here threw `Intl.RelativeTimeFormat is not a constructor` at runtime.
 */
function useRelativeTime(timestamp: string, now: number) {
  const { t } = useTranslation();
  const minutesAgo = Math.max(0, Math.round((now - new Date(timestamp).getTime()) / 60000));
  if (minutesAgo < 1) return t('history.relative.now');
  if (minutesAgo < 60) return t('history.relative.minute', { count: minutesAgo });
  if (minutesAgo < 1440) return t('history.relative.hour', { count: Math.round(minutesAgo / 60) });
  return t('history.relative.day', { count: Math.round(minutesAgo / 1440) });
}

function ActivityRow({ activity, now }: { activity: Activity; now: number }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const color = theme[TYPE_COLOR[activity.type]];
  const time = useRelativeTime(activity.timestamp, now);
  // "Subject · Item" for exams/materials; just the subject name for a subject row.
  const detail = activity.subject ? `${activity.subject} · ${activity.title}` : activity.title;

  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <View style={[styles.icon, { backgroundColor: `${color}55` }]}>
        <ThemedText style={{ color, fontSize: 18, lineHeight: 22 }}>
          {TYPE_GLYPH[activity.type]}
        </ThemedText>
      </View>
      <View style={styles.cardText}>
        <ThemedText type="smallBold">{t(`history.types.${activity.type}`)}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {detail}
        </ThemedText>
      </View>
      <View style={styles.trailing}>
        {activity.note ? (
          <ThemedText type="smallBold" style={{ color }}>
            {activity.note}
          </ThemedText>
        ) : null}
        <ThemedText type="small" themeColor="textMuted">
          {time}
        </ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  list: { gap: Spacing.two },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: { flex: 1, gap: Spacing.half },
  trailing: { alignItems: 'flex-end', gap: Spacing.half },
});
