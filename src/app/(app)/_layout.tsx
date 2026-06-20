import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

export default function AppLayout() {
  const { t } = useTranslation();
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="profile/index" options={{ title: t('profile.title') }} />
      <Stack.Screen name="profile/edit" options={{ title: t('profile.editTitle') }} />
      <Stack.Screen
        name="profile/change-password"
        options={{ title: t('profile.changePassword') }}
      />
      <Stack.Screen name="settings" options={{ title: t('settings.title') }} />
    </Stack>
  );
}
