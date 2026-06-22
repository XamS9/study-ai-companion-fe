import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { useMaterial } from '@/api/materials';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AsyncContent } from '@/components/ui/async-content';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function SummaryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const { data: material, isLoading, error, refetch } = useMaterial(id);

  return (
    <Screen>
      <AsyncContent isLoading={isLoading} error={error as Error | null} onRetry={refetch}>
        {material ? (
          <>
            <ThemedText type="subtitle">{material.title}</ThemedText>

            {material.summary ? (
              <>
                <View style={styles.block}>
                  <ThemedText type="smallBold">{t('materials.summary')}</ThemedText>
                  <ThemedView type="backgroundElement" style={styles.card}>
                    <ThemedText>{material.summary}</ThemedText>
                  </ThemedView>
                </View>

                {material.keyConcepts.length > 0 ? (
                  <View style={styles.block}>
                    <ThemedText type="smallBold">{t('materials.keyConcepts')}</ThemedText>
                    <View style={styles.chips}>
                      {material.keyConcepts.map((concept) => (
                        <View
                          key={concept}
                          style={[styles.chip, { backgroundColor: `${theme.primary}22` }]}
                        >
                          <ThemedText type="small" style={{ color: theme.primary }}>
                            {concept}
                          </ThemedText>
                        </View>
                      ))}
                    </View>
                  </View>
                ) : null}
              </>
            ) : (
              <View style={styles.empty}>
                <ThemedText type="small" themeColor="textSecondary" style={styles.message}>
                  {t('materials.noSummary')}
                </ThemedText>
                <Button
                  title={t('materials.generateStudyAids')}
                  onPress={() =>
                    router.push({ pathname: '/subjects/material/process/[id]', params: { id } })
                  }
                />
              </View>
            )}
          </>
        ) : null}
      </AsyncContent>
    </Screen>
  );
}

const styles = StyleSheet.create({
  block: { gap: Spacing.two },
  card: { padding: Spacing.three, borderRadius: Spacing.three },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  chip: { paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, borderRadius: 999 },
  empty: { gap: Spacing.three, marginTop: Spacing.two },
  message: { textAlign: 'center' },
});
