import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Avatar } from '@/components/ui/avatar';
import { Screen } from '@/components/ui/screen';
import { Spacing } from '@/constants/theme';
import { useAvatarUrl } from '@/hooks/use-avatar-url';
import { useAuthStore } from '@/store/auth';

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

export default function DashboardScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const profile = useAuthStore((s) => s.profile);
  const user = useAuthStore((s) => s.user);
  const avatarUrl = useAvatarUrl(profile?.avatar_url);

  const name = profile?.full_name?.split(' ')[0] ?? user?.email?.split('@')[0] ?? '';

  return (
    <Screen>
      <View style={styles.headerRow}>
        <View style={styles.greeting}>
          <ThemedText type="subtitle">{t('dashboard.greeting', { name })}</ThemedText>
          <ThemedText themeColor="textSecondary">{t('dashboard.title')}</ThemedText>
        </View>
        <Pressable onPress={() => router.push('/(app)/profile')} accessibilityRole="button">
          <Avatar uri={avatarUrl} name={profile?.full_name} size={56} />
        </Pressable>
      </View>

      <View style={styles.grid}>
        <StatCard label={t('dashboard.subjects')} value="0" />
        <StatCard label={t('dashboard.materials')} value="0" />
        <StatCard label={t('dashboard.average')} value="—" />
        <StatCard label={t('dashboard.lastExam')} value="—" />
      </View>

      <ThemedText type="small" themeColor="textSecondary" style={styles.empty}>
        {t('dashboard.noData')}
      </ThemedText>

      <View style={styles.menu}>
        <MenuRow label={t('dashboard.profile')} onPress={() => router.push('/(app)/profile')} />
        <MenuRow label={t('dashboard.settings')} onPress={() => router.push('/(app)/settings')} />
      </View>
    </Screen>
  );
}

function MenuRow({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button">
      <ThemedView type="backgroundElement" style={styles.menuRow}>
        <ThemedText type="smallBold">{label}</ThemedText>
        <ThemedText themeColor="textSecondary">›</ThemedText>
      </ThemedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  greeting: { gap: Spacing.one, flexShrink: 1 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.three },
  card: {
    flexGrow: 1,
    flexBasis: '45%',
    padding: Spacing.three,
    borderRadius: Spacing.three,
    gap: Spacing.one,
  },
  cardValue: { fontSize: 32, lineHeight: 36 },
  empty: { marginTop: Spacing.two },
  menu: { gap: Spacing.two, marginTop: Spacing.two },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
});
