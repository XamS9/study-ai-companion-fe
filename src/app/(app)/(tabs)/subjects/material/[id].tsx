import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { useSummarizeMaterial } from '@/api/ai';
import { useMaterial } from '@/api/materials';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AsyncContent } from '@/components/ui/async-content';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function MaterialViewerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const { data: material, isLoading, error, refetch } = useMaterial(id);
  const summarize = useSummarizeMaterial();

  return (
    <Screen>
      <AsyncContent isLoading={isLoading} error={error as Error | null} onRetry={refetch}>
        {material ? (
          <>
            <View style={styles.header}>
              <ThemedText type="subtitle">{material.title}</ThemedText>
            </View>

            <View style={styles.meta}>
              <Badge>{t(`materials.types.${material.type}`)}</Badge>
              {material.pages != null ? (
                <Badge>{t('materials.pages', { count: material.pages })}</Badge>
              ) : null}
              <Badge>
                {new Intl.DateTimeFormat(i18n.language, {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                }).format(new Date(material.createdAt))}
              </Badge>
            </View>

            {material.summary ? (
              <View style={styles.block}>
                <ThemedText type="smallBold">{t('materials.summary')}</ThemedText>
                <ThemedView type="backgroundElement" style={styles.card}>
                  <ThemedText>{material.summary}</ThemedText>
                </ThemedView>
              </View>
            ) : (
              <Button
                title={t('materials.generateSummary')}
                variant="secondary"
                loading={summarize.isPending}
                onPress={() => summarize.mutate({ materialId: material.id, persist: true })}
              />
            )}

            {summarize.error ? (
              <ThemedText type="small" style={{ color: theme.error }}>
                {(summarize.error as Error).message}
              </ThemedText>
            ) : null}

            <View style={styles.block}>
              <ThemedText type="smallBold">{t('materials.content')}</ThemedText>
              <ThemedView type="backgroundElement" style={styles.card}>
                <ThemedText themeColor={material.content ? 'text' : 'textSecondary'}>
                  {material.content || t('materials.noContent')}
                </ThemedText>
              </ThemedView>
            </View>
          </>
        ) : null}
      </AsyncContent>
    </Screen>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  return (
    <View style={[styles.badge, { borderColor: theme.border }]}>
      <ThemedText type="small" themeColor="textSecondary">
        {children}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { gap: Spacing.half },
  meta: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  badge: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: 999,
    borderWidth: 1,
  },
  block: { gap: Spacing.two },
  card: { padding: Spacing.three, borderRadius: Spacing.three },
});
