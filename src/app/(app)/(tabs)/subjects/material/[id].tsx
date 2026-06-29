import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Image, Linking, StyleSheet, View } from 'react-native';

import { useSummarizeMaterial } from '@/api/ai';
import { useDeleteMaterial, useMaterial } from '@/api/materials';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AsyncContent } from '@/components/ui/async-content';
import { Button } from '@/components/ui/button';
import { CopyButton } from '@/components/ui/copy-button';
import { Markdown } from '@/components/ui/markdown';
import { Screen } from '@/components/ui/screen';
import { Spacing } from '@/constants/theme';
import { useMaterialFileUrl } from '@/hooks/use-material-file-url';
import { useTheme } from '@/hooks/use-theme';
import { markdownToPlainText } from '@/lib/markdown';

export default function MaterialViewerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const { data: material, isLoading, error, refetch } = useMaterial(id);
  const summarize = useSummarizeMaterial();
  const fileUrl = useMaterialFileUrl(material?.fileUrl);
  const deleteMaterial = useDeleteMaterial(material?.subjectId);

  const confirmDelete = () => {
    Alert.alert(t('materials.deleteTitle'), t('materials.deleteMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          await deleteMaterial.mutateAsync(id);
          router.back();
        },
      },
    ]);
  };

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

            {material.fileUrl ? (
              <View style={styles.block}>
                <ThemedText type="smallBold">{t('materials.file')}</ThemedText>
                {material.type === 'image' ? (
                  fileUrl ? (
                    <Image source={{ uri: fileUrl }} style={styles.image} resizeMode="cover" />
                  ) : (
                    <ThemedView type="backgroundElement" style={[styles.card, styles.imageLoader]}>
                      <ActivityIndicator color={theme.primary} />
                    </ThemedView>
                  )
                ) : (
                  <Button
                    title={t('materials.openFile')}
                    variant="secondary"
                    disabled={!fileUrl}
                    onPress={() => {
                      if (fileUrl) void Linking.openURL(fileUrl);
                    }}
                  />
                )}
              </View>
            ) : null}

            {material.summary ? (
              <View style={styles.block}>
                <View style={styles.blockHeader}>
                  <ThemedText type="smallBold">{t('materials.summary')}</ThemedText>
                  <CopyButton
                    value={markdownToPlainText(material.summary)}
                    accessibilityLabel={`${t('common.copy')} ${t('materials.summary')}`}
                  />
                </View>
                <ThemedView type="backgroundElement" style={styles.card}>
                  <Markdown>{material.summary}</Markdown>
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
              <View style={styles.blockHeader}>
                <ThemedText type="smallBold">{t('materials.content')}</ThemedText>
                {material.content ? (
                  <CopyButton
                    value={material.content}
                    accessibilityLabel={`${t('common.copy')} ${t('materials.content')}`}
                  />
                ) : null}
              </View>
              <ThemedView type="backgroundElement" style={styles.card}>
                <ThemedText themeColor={material.content ? 'text' : 'textSecondary'}>
                  {material.content || t('materials.noContent')}
                </ThemedText>
              </ThemedView>
            </View>

            <Button
              title={t('materials.delete')}
              variant="ghost"
              loading={deleteMaterial.isPending}
              onPress={confirmDelete}
            />
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
  blockHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  card: { padding: Spacing.three, borderRadius: Spacing.three },
  image: { width: '100%', aspectRatio: 3 / 4, borderRadius: Spacing.three },
  imageLoader: { alignItems: 'center', paddingVertical: Spacing.four },
});
