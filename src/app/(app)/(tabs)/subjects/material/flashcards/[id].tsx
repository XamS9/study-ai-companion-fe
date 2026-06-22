import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { useFlashcards } from '@/api/materials';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AsyncContent } from '@/components/ui/async-content';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function FlashcardsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const { data: cards, isLoading, error, refetch } = useFlashcards(id);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const total = cards?.length ?? 0;
  const card = cards?.[index];

  const go = (delta: number) => {
    setFlipped(false);
    setIndex((i) => Math.min(Math.max(i + delta, 0), total - 1));
  };

  return (
    <Screen>
      <AsyncContent
        isLoading={isLoading}
        error={error as Error | null}
        isEmpty={total === 0}
        emptyText={t('materials.noFlashcards')}
        onRetry={refetch}
      >
        {card ? (
          <>
            <ThemedText type="small" themeColor="textSecondary" style={styles.counter}>
              {t('materials.flashcardProgress', { current: index + 1, total })}
            </ThemedText>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('materials.flipHint')}
              onPress={() => setFlipped((f) => !f)}
            >
              <ThemedView
                type="backgroundElement"
                style={[styles.card, { borderColor: flipped ? theme.primary : theme.border }]}
              >
                <ThemedText type="small" themeColor="textSecondary" style={styles.side}>
                  {flipped ? t('materials.back') : t('materials.front')}
                </ThemedText>
                <ThemedText type="subtitle" style={styles.cardText}>
                  {flipped ? card.back : card.front}
                </ThemedText>
                <ThemedText type="small" themeColor="textMuted">
                  {t('materials.flipHint')}
                </ThemedText>
              </ThemedView>
            </Pressable>

            <View style={styles.nav}>
              <Button
                title={t('common.back')}
                variant="secondary"
                disabled={index === 0}
                onPress={() => go(-1)}
                style={styles.navButton}
              />
              <Button
                title={t('materials.next')}
                variant="secondary"
                disabled={index >= total - 1}
                onPress={() => go(1)}
                style={styles.navButton}
              />
            </View>
          </>
        ) : (
          <View style={styles.empty}>
            <Button
              title={t('materials.generateStudyAids')}
              onPress={() =>
                router.push({ pathname: '/subjects/material/process/[id]', params: { id } })
              }
            />
          </View>
        )}
      </AsyncContent>
    </Screen>
  );
}

const styles = StyleSheet.create({
  counter: { textAlign: 'center' },
  card: {
    minHeight: 280,
    borderRadius: Spacing.four,
    borderWidth: 2,
    padding: Spacing.four,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
  },
  side: { textTransform: 'uppercase', letterSpacing: 1 },
  cardText: { textAlign: 'center' },
  nav: { flexDirection: 'row', gap: Spacing.three },
  navButton: { flex: 1 },
  empty: { marginTop: Spacing.two },
});
