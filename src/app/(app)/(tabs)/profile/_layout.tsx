import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

/** Stack inside the Perfil tab so edit / change-password push with a back button. */
export default function ProfileLayout() {
  const { t } = useTranslation();
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: t('profile.title') }} />
      <Stack.Screen name="edit" options={{ title: t('profile.editTitle') }} />
      <Stack.Screen name="change-password" options={{ title: t('profile.changePassword') }} />
    </Stack>
  );
}
