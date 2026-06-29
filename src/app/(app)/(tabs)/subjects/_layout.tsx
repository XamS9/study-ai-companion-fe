import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

/** Stack inside the Materias tab so detail / new / material screens push with a back button. */
export default function SubjectsLayout() {
  const { t } = useTranslation();
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="[id]" options={{ title: t('subjects.title') }} />
      <Stack.Screen name="new" options={{ title: t('subjects.new.title') }} />
      <Stack.Screen name="edit/[id]" options={{ title: t('subjects.edit.title') }} />
      <Stack.Screen name="material/new" options={{ title: t('materials.new.title') }} />
      <Stack.Screen name="material/[id]" options={{ title: t('materials.title') }} />
      <Stack.Screen name="questions/[id]" options={{ title: t('questions.title') }} />
    </Stack>
  );
}
