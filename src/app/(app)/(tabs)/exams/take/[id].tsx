import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { useExam, useSubmitExam } from '@/api/exams';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AsyncContent } from '@/components/ui/async-content';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function TakeExamScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const { data: exam, isLoading, error, refetch } = useExam(id);
  const submitExam = useSubmitExam(id);
  const startedAt = useRef(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  // Record the start time once, after mount, to time the attempt.
  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  const total = exam?.questions.length ?? 0;
  const answeredCount = useMemo(() => Object.keys(answers).length, [answers]);

  const submit = async () => {
    if (!exam) return;
    await submitExam.mutateAsync({
      timeElapsedSeconds: Math.round((Date.now() - startedAt.current) / 1000),
      answers: exam.questions.map((q) => ({
        examQuestionId: q.id,
        answer: answers[q.id] ?? '',
      })),
    });
    router.replace({ pathname: '/exams/[id]', params: { id } });
  };

  return (
    <Screen>
      <AsyncContent isLoading={isLoading} error={error as Error | null} onRetry={refetch}>
        {exam ? (
          <>
            <View style={styles.header}>
              <ThemedText type="subtitle">{exam.name}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {t('exams.take.progress', { answered: answeredCount, total })}
              </ThemedText>
            </View>

            {exam.questions.map((q, i) => (
              <ThemedView key={q.id} type="backgroundElement" style={styles.card}>
                <ThemedText type="smallBold">
                  {i + 1}. {q.prompt}
                </ThemedText>
                <View style={styles.options}>
                  {q.options.map((option) => {
                    const selected = answers[q.id] === option;
                    return (
                      <Pressable
                        key={option}
                        accessibilityRole="button"
                        accessibilityState={{ selected }}
                        onPress={() => setAnswers((prev) => ({ ...prev, [q.id]: option }))}
                        style={[
                          styles.option,
                          {
                            backgroundColor: selected ? theme.primary : theme.background,
                            borderColor: selected ? theme.primary : theme.border,
                          },
                        ]}
                      >
                        <ThemedText
                          type="small"
                          style={{ color: selected ? theme.primaryText : theme.text }}
                        >
                          {option}
                        </ThemedText>
                      </Pressable>
                    );
                  })}
                </View>
              </ThemedView>
            ))}

            {submitExam.error ? (
              <ThemedText type="small" style={{ color: theme.error }}>
                {(submitExam.error as Error).message}
              </ThemedText>
            ) : null}

            <Button
              title={t('exams.take.finish')}
              onPress={submit}
              loading={submitExam.isPending}
              disabled={answeredCount < total}
            />
          </>
        ) : null}
      </AsyncContent>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: Spacing.half },
  card: { padding: Spacing.three, borderRadius: Spacing.three, gap: Spacing.three },
  options: { gap: Spacing.two },
  option: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.two,
    borderWidth: 1,
  },
});
