import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** Branded splash shown while the session, theme and language hydrate on launch. */
export function Splash() {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <ThemedView style={styles.container}>
      <View style={[styles.logo, { backgroundColor: theme.primary }]}>
        <ThemedText style={[styles.glyph, { color: theme.primaryText }]}>✦</ThemedText>
      </View>
      <ThemedText type="subtitle" style={styles.name}>
        {t('common.appName')}
      </ThemedText>
      <ActivityIndicator color={theme.primary} style={styles.spinner} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.three },
  logo: {
    width: 88,
    height: 88,
    borderRadius: Spacing.four,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glyph: { fontSize: 44, lineHeight: 52 },
  name: { textAlign: 'center' },
  spinner: { marginTop: Spacing.two },
});
