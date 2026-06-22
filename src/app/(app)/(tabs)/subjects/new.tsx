import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { useCreateSubject } from '@/api/subjects';
import type { SubjectColor } from '@/api/types';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Screen } from '@/components/ui/screen';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const COLORS: SubjectColor[] = ['primary', 'accent', 'warning', 'error', 'success'];

export default function NewSubjectScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState<SubjectColor>('primary');
  const { mutateAsync, isPending, error } = useCreateSubject();

  const create = async () => {
    await mutateAsync({
      name: name.trim(),
      code: code.trim() || undefined,
      description: description.trim() || undefined,
      color,
    });
    router.back();
  };

  return (
    <Screen>
      <Field
        label={t('subjects.new.name')}
        value={name}
        onChangeText={setName}
        placeholder={t('subjects.new.namePlaceholder')}
        autoCapitalize="words"
      />
      <Field
        label={t('subjects.new.code')}
        value={code}
        onChangeText={setCode}
        placeholder={t('subjects.new.codePlaceholder')}
        autoCapitalize="characters"
      />
      <Field
        label={t('subjects.new.description')}
        value={description}
        onChangeText={setDescription}
        placeholder={t('subjects.new.descriptionPlaceholder')}
        multiline
      />

      <View style={styles.colorBlock}>
        <ThemedText type="small" themeColor="textSecondary">
          {t('subjects.new.color')}
        </ThemedText>
        <View style={styles.swatchRow}>
          {COLORS.map((c) => {
            const selected = c === color;
            return (
              <Pressable
                key={c}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => setColor(c)}
                style={[
                  styles.swatch,
                  { backgroundColor: theme[c], borderColor: selected ? theme.text : 'transparent' },
                ]}
              />
            );
          })}
        </View>
      </View>

      {error ? (
        <ThemedText type="small" style={{ color: theme.error }}>
          {(error as Error).message}
        </ThemedText>
      ) : null}

      <Button
        title={t('subjects.new.create')}
        onPress={create}
        loading={isPending}
        disabled={!name.trim()}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  colorBlock: { gap: Spacing.two },
  swatchRow: { flexDirection: 'row', gap: Spacing.three },
  swatch: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
  },
});
