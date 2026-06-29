import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

/**
 * Root navigator for the authenticated area. Holds the bottom-tab group plus any
 * screens that slide in *over* the tabs with a back button (settings).
 */
export default function AppLayout() {
  const { t } = useTranslation();
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="settings" options={{ title: t('settings.title') }} />
      <Stack.Screen name="stats" options={{ title: t('stats.title') }} />
      <Stack.Screen name="diagnostics" options={{ title: t('diagnostics.title') }} />
    </Stack>
  );
}
