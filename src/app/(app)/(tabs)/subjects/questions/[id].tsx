import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Alert, StyleSheet, View } from 'react-native';

import { useRegenerateQuestions } from '@/api/ai';
import { useSubjectQuestions } from '@/api/questions';
import type { Question } from '@/api/types';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AsyncContent } from '@/components/ui/async-content';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { Spacing } from '@/constants/theme';
import { useCountdown } from '@/hooks/use-countdown';
import { useTheme } from '@/hooks/use-theme';
import { ApiError } from '@/lib/api';

export default function QuestionBankScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const theme = useTheme();
  const { data, isLoading, error, refetch } = useSubjectQuestions(id);
  const questions = data ?? [];

  const regenerate = useRegenerateQuestions(id);
  const cooldown = useCountdown();

  const runRegenerate = () => {
    regenerate.mutate(undefined, {
      onSuccess: () => cooldown.start(60),
      onError: (err) => {
        // On a 429 the backend tells us exactly how long to wait.
        if (err instanceof ApiError && err.status === 429 && err.retryAfterSeconds) {
          cooldown.start(err.retryAfterSeconds);
        }
      },
    });
  };

  const confirmRegenerate = () => {
    Alert.alert(t('questions.regenerateTitle'), t('questions.regenerateMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('questions.regenerate'), style: 'destructive', onPress: runRegenerate },
    ]);
  };

  const onCooldown = cooldown.seconds > 0;
  // Show the server message for real failures, but not the 429 (the countdown covers it).
  const regenerateError =
    regenerate.error && !(regenerate.error instanceof ApiError && regenerate.error.status === 429)
      ? (regenerate.error as Error).message
      : null;

  return (
    <Screen>
      <View style={styles.header}>
        <ThemedText type="small" themeColor="textSecondary">
          {t('questions.subtitle', { count: questions.length })}
        </ThemedText>
        <Button
          title={onCooldown ? t('questions.regenerateIn', { seconds: cooldown.seconds }) : t('questions.regenerate')}
          variant="secondary"
          loading={regenerate.isPending}
          disabled={regenerate.isPending || onCooldown}
          onPress={confirmRegenerate}
        />
        {regenerateError ? (
          <ThemedText type="small" style={{ color: theme.error }}>
            {regenerateError}
          </ThemedText>
        ) : null}
      </View>

      <AsyncContent
        isLoading={isLoading}
        error={error as Error | null}
        isEmpty={questions.length === 0}
        emptyText={t('questions.empty')}
        onRetry={refetch}
      >
        <View style={styles.list}>
          {questions.map((q, i) => (
            <QuestionCard key={q.id} question={q} index={i + 1} />
          ))}
        </View>
      </AsyncContent>
    </Screen>
  );
}

function QuestionCard({ question, index }: { question: Question; index: number }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const isCorrect = (option: string) =>
    option.trim().toLowerCase() === question.correctAnswer.trim().toLowerCase();

  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <View style={styles.cardHeader}>
        <ThemedText type="smallBold" style={styles.index}>
          {index}.
        </ThemedText>
        <ThemedText type="smallBold" style={styles.prompt}>
          {question.prompt}
        </ThemedText>
      </View>

      <View style={[styles.badge, { borderColor: theme.border }]}>
        <ThemedText type="small" themeColor="textSecondary">
          {t(`questions.types.${question.type}`)}
        </ThemedText>
      </View>

      <View style={styles.options}>
        {question.options.map((option) => {
          const correct = isCorrect(option);
          return (
            <View
              key={option}
              style={[
                styles.option,
                {
                  backgroundColor: correct ? `${theme.success}22` : 'transparent',
                  borderColor: correct ? theme.success : theme.border,
                },
              ]}
            >
              <ThemedText type="small" themeColor={correct ? 'success' : 'text'}>
                {correct ? '✓ ' : ''}
                {option}
              </ThemedText>
            </View>
          );
        })}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  header: { gap: Spacing.two },
  list: { gap: Spacing.two },
  card: { gap: Spacing.two, padding: Spacing.three, borderRadius: Spacing.three },
  cardHeader: { flexDirection: 'row', gap: Spacing.two },
  index: { width: 20 },
  prompt: { flex: 1 },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: 999,
    borderWidth: 1,
  },
  options: { gap: Spacing.one },
  option: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.two,
    borderWidth: 1,
  },
});
