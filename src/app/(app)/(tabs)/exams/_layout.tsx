import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

/** Stack inside the Exámenes tab so the exam detail pushes with a back button. */
export default function ExamsLayout() {
  const { t } = useTranslation();
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="new" options={{ title: t('exams.new.title') }} />
      <Stack.Screen name="[id]" options={{ title: t('exams.title') }} />
      <Stack.Screen name="take/[id]" options={{ title: t('exams.take.title') }} />
    </Stack>
  );
}
