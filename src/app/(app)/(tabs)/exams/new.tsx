import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { useCreateExam } from '@/api/exams';
import { useSubjects } from '@/api/subjects';
import { ThemedText } from '@/components/themed-text';
import { AsyncContent } from '@/components/ui/async-content';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Screen } from '@/components/ui/screen';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function NewExamScreen() {
  const params = useLocalSearchParams<{ subjectId?: string }>();
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const { data: subjects, isLoading, error, refetch } = useSubjects();
  const [subjectId, setSubjectId] = useState<string | undefined>(params.subjectId);
  const [name, setName] = useState('');
  const [count, setCount] = useState('10');
  const createExam = useCreateExam();

  const create = async () => {
    if (!subjectId) return;
    const parsed = parseInt(count, 10);
    const exam = await createExam.mutateAsync({
      subjectId,
      name: name.trim(),
      questionCount: Number.isFinite(parsed) ? parsed : 10,
    });
    router.replace({ pathname: '/exams/[id]', params: { id: exam.id } });
  };

  return (
    <Screen>
      <AsyncContent
        isLoading={isLoading}
        error={error as Error | null}
        isEmpty={(subjects ?? []).length === 0}
        emptyText={t('exams.new.noSubjects')}
        onRetry={refetch}
      >
        <ThemedText type="small" themeColor="textSecondary">
          {t('exams.new.subject')}
        </ThemedText>
        <View style={styles.chips}>
          {(subjects ?? []).map((s) => {
            const selected = s.id === subjectId;
            return (
              <Pressable
                key={s.id}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => setSubjectId(s.id)}
                style={[
                  styles.chip,
                  {
                    backgroundColor: selected ? theme.primary : theme.backgroundElement,
                    borderColor: selected ? theme.primary : theme.border,
                  },
                ]}
              >
                <ThemedText
                  type="small"
                  style={{ color: selected ? theme.primaryText : theme.textSecondary }}
                >
                  {s.name}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>

        <Field
          label={t('exams.new.name')}
          value={name}
          onChangeText={setName}
          placeholder={t('exams.new.namePlaceholder')}
          autoCapitalize="sentences"
        />
        <Field
          label={t('exams.new.questionCount')}
          value={count}
          onChangeText={setCount}
          keyboardType="number-pad"
        />

        <ThemedText type="small" themeColor="textSecondary">
          {t('exams.new.hint')}
        </ThemedText>

        {createExam.error ? (
          <ThemedText type="small" style={{ color: theme.error }}>
            {(createExam.error as Error).message}
          </ThemedText>
        ) : null}

        <Button
          title={t('exams.new.create')}
          onPress={create}
          loading={createExam.isPending}
          disabled={!subjectId || !name.trim()}
        />
      </AsyncContent>
    </Screen>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  chip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: 999,
    borderWidth: 1,
  },
});
