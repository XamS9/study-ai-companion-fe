import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Alert, StyleSheet, View } from 'react-native';

import { useDeleteExam, useExam } from '@/api/exams';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AsyncContent } from '@/components/ui/async-content';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatDuration } from '@/lib/format';
import { scoreColorKey } from '@/lib/score';

export default function ExamDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const { data: exam, isLoading, error, refetch } = useExam(id);
  const deleteExam = useDeleteExam(exam?.subjectId);

  const confirmDelete = () => {
    Alert.alert(t('exams.deleteTitle'), t('exams.deleteMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          await deleteExam.mutateAsync(id);
          router.back();
        },
      },
    ]);
  };

  return (
    <Screen>
      <AsyncContent isLoading={isLoading} error={error as Error | null} onRetry={refetch}>
        {exam ? (
          (() => {
            const completed = exam.score !== null;
            const total = exam.questions.length;
            const date = new Intl.DateTimeFormat(i18n.language, {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            }).format(new Date(exam.date));

            return (
              <>
                <View style={styles.header}>
                  <ThemedText type="subtitle">{exam.name}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {date}
                  </ThemedText>
                </View>

                {completed ? (
                  <ThemedView type="backgroundElement" style={styles.scoreCard}>
                    <ThemedText type="title" style={{ color: theme[scoreColorKey(exam.score!)] }}>
                      {exam.score}%
                    </ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      {t('exams.detail.correct', { correct: exam.correctCount ?? 0, total })}
                    </ThemedText>
                    {exam.timeElapsedSeconds != null ? (
                      <ThemedText type="small" themeColor="textSecondary">
                        {t('exams.detail.time', {
                          duration: formatDuration(exam.timeElapsedSeconds),
                        })}
                      </ThemedText>
                    ) : null}
                  </ThemedView>
                ) : (
                  <ThemedView type="backgroundElement" style={styles.upcomingCard}>
                    <View style={[styles.badge, { borderColor: theme.primary }]}>
                      <ThemedText type="small" style={{ color: theme.primary }}>
                        {t('exams.upcoming')}
                      </ThemedText>
                    </View>
                    <ThemedText type="small" themeColor="textSecondary">
                      {t('exams.detail.upcomingNote', { count: total })}
                    </ThemedText>
                    <Button
                      title={t('exams.detail.take')}
                      onPress={() =>
                        router.push({ pathname: '/exams/take/[id]', params: { id: exam.id } })
                      }
                    />
                  </ThemedView>
                )}

                <View style={styles.section}>
                  <ThemedText type="smallBold">
                    {completed ? t('exams.detail.review') : t('exams.detail.preview')}
                  </ThemedText>
                  <View style={styles.list}>
                    {exam.questions.map((q, i) => (
                      <ThemedView key={q.id} type="backgroundElement" style={styles.row}>
                        <ThemedText type="smallBold" themeColor="textSecondary" style={styles.index}>
                          {i + 1}
                        </ThemedText>
                        <View style={styles.qBody}>
                          <ThemedText type="small">{q.prompt}</ThemedText>
                          {completed ? (
                            <ThemedText type="small" themeColor="textSecondary">
                              {t('exams.detail.answer', {
                                answer: q.correctAnswer,
                              })}
                            </ThemedText>
                          ) : null}
                        </View>
                        {completed && q.isCorrect !== null ? (
                          <ThemedText
                            type="smallBold"
                            style={{ color: q.isCorrect ? theme.success : theme.error }}
                          >
                            {q.isCorrect ? '✓' : '✗'}
                          </ThemedText>
                        ) : null}
                      </ThemedView>
                    ))}
                  </View>
                </View>

                <Button
                  title={t('exams.detail.delete')}
                  variant="ghost"
                  loading={deleteExam.isPending}
                  onPress={confirmDelete}
                />
              </>
            );
          })()
        ) : null}
      </AsyncContent>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: Spacing.half },
  scoreCard: {
    alignItems: 'center',
    gap: Spacing.one,
    padding: Spacing.four,
    borderRadius: Spacing.three,
  },
  upcomingCard: {
    alignItems: 'flex-start',
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
  section: { gap: Spacing.two },
  list: { gap: Spacing.two },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
  index: { width: 16, textAlign: 'center', lineHeight: 20 },
  qBody: { flex: 1, gap: Spacing.half },
  badge: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: 999,
    borderWidth: 1,
  },
});
