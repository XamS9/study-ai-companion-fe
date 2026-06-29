import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import type { SubjectColor } from '@/api/types';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const COLORS: SubjectColor[] = ['primary', 'accent', 'warning', 'error', 'success'];
const PROGRESS_STEP = 5;
const clampProgress = (n: number) => Math.max(0, Math.min(100, n));

/** Trimmed values emitted on submit; `progress` is only included when the stepper is shown. */
export type SubjectFormValues = {
  name: string;
  code?: string;
  description?: string;
  color: SubjectColor;
  progress?: number;
};

type SubjectFormProps = {
  submitLabel: string;
  onSubmit: (values: SubjectFormValues) => void | Promise<void>;
  initial?: {
    name?: string;
    code?: string;
    description?: string;
    color?: SubjectColor;
    progress?: number;
  };
  /** Show the manual progress stepper (used on the edit screen, hidden on create). */
  showProgress?: boolean;
  isPending?: boolean;
  error?: Error | null;
};

/** Shared create/edit form for subjects. Owns its field state; seeded from `initial`. */
export function SubjectForm({
  submitLabel,
  onSubmit,
  initial,
  showProgress = false,
  isPending = false,
  error,
}: SubjectFormProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const [name, setName] = useState(initial?.name ?? '');
  const [code, setCode] = useState(initial?.code ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [color, setColor] = useState<SubjectColor>(initial?.color ?? 'primary');
  const [progress, setProgress] = useState(initial?.progress ?? 0);

  const submit = () =>
    onSubmit({
      name: name.trim(),
      code: code.trim() || undefined,
      description: description.trim() || undefined,
      color,
      ...(showProgress ? { progress } : {}),
    });

  return (
    <>
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

      <View style={styles.block}>
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

      {showProgress ? (
        <View style={styles.block}>
          <View style={styles.progressRow}>
            <ThemedText type="small" themeColor="textSecondary">
              {t('subjects.new.progress')}
            </ThemedText>
            <ThemedText type="smallBold" style={{ color: theme[color] }}>
              {progress}%
            </ThemedText>
          </View>
          <View style={styles.stepperRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('subjects.new.progressDecrease')}
              disabled={progress <= 0}
              onPress={() => setProgress((p) => clampProgress(p - PROGRESS_STEP))}
              style={[
                styles.stepBtn,
                { borderColor: theme.border, opacity: progress <= 0 ? 0.4 : 1 },
              ]}
            >
              <ThemedText type="subtitle">−</ThemedText>
            </Pressable>
            <View style={[styles.track, { backgroundColor: theme.backgroundSelected }]}>
              <View
                style={[styles.fill, { width: `${progress}%`, backgroundColor: theme[color] }]}
              />
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('subjects.new.progressIncrease')}
              disabled={progress >= 100}
              onPress={() => setProgress((p) => clampProgress(p + PROGRESS_STEP))}
              style={[
                styles.stepBtn,
                { borderColor: theme.border, opacity: progress >= 100 ? 0.4 : 1 },
              ]}
            >
              <ThemedText type="subtitle">+</ThemedText>
            </Pressable>
          </View>
        </View>
      ) : null}

      {error ? (
        <ThemedText type="small" style={{ color: theme.error }}>
          {error.message}
        </ThemedText>
      ) : null}

      <Button title={submitLabel} onPress={submit} loading={isPending} disabled={!name.trim()} />
    </>
  );
}

const styles = StyleSheet.create({
  block: { gap: Spacing.two },
  swatchRow: { flexDirection: 'row', gap: Spacing.three },
  swatch: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
  },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  stepperRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  stepBtn: {
    width: 44,
    height: 44,
    borderRadius: Spacing.two,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  track: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' },
  fill: { height: 6, borderRadius: 3 },
});
