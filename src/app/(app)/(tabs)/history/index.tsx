import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Screen } from '@/components/ui/screen';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ActivityType = 'exam' | 'material' | 'subject';

type Activity = {
  id: string;
  type: ActivityType;
  /** Subject + item, e.g. "Cálculo I · Parcial 1". */
  detail: string;
  /** Trailing note such as a score; omitted when not applicable. */
  note?: string;
  /** How long ago the activity happened, in minutes. */
  minutesAgo: number;
};

const TYPE_GLYPH: Record<ActivityType, string> = { exam: '✎', material: '◫', subject: '＋' };
const TYPE_COLOR: Record<ActivityType, 'success' | 'accent' | 'primary'> = {
  exam: 'success',
  material: 'accent',
  subject: 'primary',
};

// Placeholder data until the activity data layer lands.
const MOCK_ACTIVITY: Activity[] = [
  { id: '1', type: 'exam', detail: 'Cálculo I · Parcial 1', note: '85%', minutesAgo: 120 },
  { id: '2', type: 'material', detail: 'Programación · Apuntes Tema 3', minutesAgo: 360 },
  { id: '3', type: 'subject', detail: 'Física I', minutesAgo: 1440 },
  { id: '4', type: 'exam', detail: 'Física I · Parcial 2', note: '48%', minutesAgo: 2880 },
  { id: '5', type: 'material', detail: 'Historia Universal · PDF Capítulo 4', minutesAgo: 4320 },
];

export default function HistoryScreen() {
  const { t } = useTranslation();

  return (
    <Screen>
      <ThemedText type="subtitle">{t('history.title')}</ThemedText>

      {MOCK_ACTIVITY.length === 0 ? (
        <ThemedText type="small" themeColor="textSecondary" style={styles.empty}>
          {t('history.empty')}
        </ThemedText>
      ) : (
        <View style={styles.list}>
          {MOCK_ACTIVITY.map((a) => (
            <ActivityRow key={a.id} activity={a} />
          ))}
        </View>
      )}
    </Screen>
  );
}

/**
 * Localized "x hours ago" using the coarsest sensible unit. Built on i18next
 * plurals rather than `Intl.RelativeTimeFormat` — Hermes (RN's JS engine) ships
 * `Intl.DateTimeFormat`/`NumberFormat` but not `RelativeTimeFormat`, so using it
 * here threw `Intl.RelativeTimeFormat is not a constructor` at runtime.
 */
function useRelativeTime(minutesAgo: number) {
  const { t } = useTranslation();
  if (minutesAgo < 1) return t('history.relative.now');
  if (minutesAgo < 60) return t('history.relative.minute', { count: minutesAgo });
  if (minutesAgo < 1440) return t('history.relative.hour', { count: Math.round(minutesAgo / 60) });
  return t('history.relative.day', { count: Math.round(minutesAgo / 1440) });
}

function ActivityRow({ activity }: { activity: Activity }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const color = theme[TYPE_COLOR[activity.type]];
  const time = useRelativeTime(activity.minutesAgo);

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
          {activity.detail}
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
  empty: { marginTop: Spacing.two, textAlign: 'center' },
});
