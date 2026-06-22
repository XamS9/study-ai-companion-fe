import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { useProcessMaterial } from '@/api/ai';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function AiProcessingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const { mutate, isSuccess, error, reset } = useProcessMaterial();
  const started = useRef(false);

  const run = () => mutate({ materialId: id });

  // Kick off processing once on mount.
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Return to the material once the study aids are ready.
  useEffect(() => {
    if (isSuccess) router.replace({ pathname: '/subjects/material/[id]', params: { id } });
  }, [isSuccess, id, router]);

  const steps = [
    t('ai.steps.summary'),
    t('ai.steps.concepts'),
    t('ai.steps.flashcards'),
    t('ai.steps.questions'),
  ];

  return (
    <Screen scroll={false} contentStyle={styles.content}>
      <View style={styles.center}>
        {error ? (
          <>
            <ThemedText type="subtitle" style={styles.title}>
              {t('ai.failedTitle')}
            </ThemedText>
            <ThemedText type="small" style={[styles.message, { color: theme.error }]}>
              {(error as Error).message}
            </ThemedText>
            <Button
              title={t('common.retry')}
              onPress={() => {
                reset();
                run();
              }}
            />
          </>
        ) : (
          <>
            <ActivityIndicator size="large" color={theme.primary} />
            <ThemedText type="subtitle" style={styles.title}>
              {t('ai.processingTitle')}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.message}>
              {t('ai.processingSubtitle')}
            </ThemedText>
            <View style={styles.steps}>
              {steps.map((step) => (
                <ThemedText key={step} type="small" themeColor="textSecondary">
                  • {step}
                </ThemedText>
              ))}
            </View>
          </>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, justifyContent: 'center' },
  center: { alignItems: 'center', gap: Spacing.three },
  title: { textAlign: 'center' },
  message: { textAlign: 'center' },
  steps: { gap: Spacing.one, alignItems: 'center', marginTop: Spacing.two },
});
