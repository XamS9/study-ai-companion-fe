import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { useDeleteSubject, useSubject } from '@/api/subjects';
import type { Exam, Material } from '@/api/types';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AsyncContent } from '@/components/ui/async-content';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { scoreColorKey } from '@/lib/score';

const MATERIAL_ICON = {
  pdf: 'document-text-outline',
  image: 'image-outline',
  note: 'create-outline',
} as const satisfies Record<string, string>;

export default function SubjectDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const { data: subject, isLoading, error, refetch } = useSubject(id);
  const deleteSubject = useDeleteSubject();

  const confirmDelete = () => {
    Alert.alert(t('subjects.detail.deleteTitle'), t('subjects.detail.deleteMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          await deleteSubject.mutateAsync(id);
          router.back();
        },
      },
    ]);
  };

  return (
    <Screen>
      <AsyncContent isLoading={isLoading} error={error as Error | null} onRetry={refetch}>
        {subject ? (
          <>
            <View style={styles.header}>
              <View style={[styles.swatch, { backgroundColor: `${theme[subject.color]}55` }]} />
              <View style={styles.headerText}>
                <ThemedText type="subtitle">{subject.name}</ThemedText>
                {subject.code ? (
                  <ThemedText type="small" themeColor="textSecondary">
                    {subject.code}
                  </ThemedText>
                ) : null}
              </View>
            </View>

            {subject.description ? (
              <ThemedText themeColor="textSecondary">{subject.description}</ThemedText>
            ) : null}

            <View style={styles.progressBlock}>
              <View style={styles.progressRow}>
                <ThemedText type="small" themeColor="textSecondary">
                  {t('subjects.detail.progress')}
                </ThemedText>
                <ThemedText type="smallBold" style={{ color: theme[subject.color] }}>
                  {subject.progress}%
                </ThemedText>
              </View>
              <View style={[styles.track, { backgroundColor: theme.backgroundSelected }]}>
                <View
                  style={[
                    styles.fill,
                    { width: `${subject.progress}%`, backgroundColor: theme[subject.color] },
                  ]}
                />
              </View>
            </View>

            <Section
              title={t('subjects.detail.materials')}
              actionLabel={t('subjects.detail.addMaterial')}
              onAction={() =>
                router.push({ pathname: '/subjects/material/new', params: { subjectId: id } })
              }
            >
              {subject.materials.length === 0 ? (
                <ThemedText type="small" themeColor="textSecondary">
                  {t('subjects.detail.noMaterials')}
                </ThemedText>
              ) : (
                subject.materials.map((m) => <MaterialRow key={m.id} material={m} />)
              )}
            </Section>

            <Section
              title={t('subjects.detail.exams')}
              actionLabel={t('subjects.detail.addExam')}
              onAction={() => router.push({ pathname: '/exams/new', params: { subjectId: id } })}
            >
              {subject.exams.length === 0 ? (
                <ThemedText type="small" themeColor="textSecondary">
                  {t('subjects.detail.noExams')}
                </ThemedText>
              ) : (
                subject.exams.map((e) => <ExamRow key={e.id} exam={e} />)
              )}
            </Section>

            <Button
              title={t('subjects.detail.edit')}
              variant="secondary"
              onPress={() => router.push({ pathname: '/subjects/edit/[id]', params: { id } })}
            />

            <Button
              title={t('subjects.detail.questionBank')}
              variant="secondary"
              onPress={() =>
                router.push({ pathname: '/subjects/questions/[id]', params: { id } })
              }
            />

            <Button
              title={t('subjects.detail.deleteSubject')}
              variant="ghost"
              loading={deleteSubject.isPending}
              onPress={confirmDelete}
            />
          </>
        ) : null}
      </AsyncContent>
    </Screen>
  );
}

function Section({
  title,
  actionLabel,
  onAction,
  children,
}: {
  title: string;
  actionLabel: string;
  onAction: () => void;
  children: React.ReactNode;
}) {
  const theme = useTheme();
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <ThemedText type="smallBold">{title}</ThemedText>
        <Pressable accessibilityRole="button" accessibilityLabel={actionLabel} onPress={onAction}>
          <ThemedText type="smallBold" style={{ color: theme.primary }}>
            + {actionLabel}
          </ThemedText>
        </Pressable>
      </View>
      <View style={styles.list}>{children}</View>
    </View>
  );
}

function MaterialRow({ material }: { material: Material }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() =>
        router.push({ pathname: '/subjects/material/[id]', params: { id: material.id } })
      }
    >
      <ThemedView type="backgroundElement" style={styles.row}>
        <View style={[styles.rowIcon, { backgroundColor: theme.backgroundSelected }]}>
          <Ionicons name={MATERIAL_ICON[material.type]} size={20} color={theme.textSecondary} />
        </View>
        <View style={styles.rowText}>
          <ThemedText type="smallBold">{material.title}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {t(`materials.types.${material.type}`)}
            {material.pages != null ? ` · ${t('materials.pages', { count: material.pages })}` : ''}
          </ThemedText>
        </View>
        <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
      </ThemedView>
    </Pressable>
  );
}

function ExamRow({ exam }: { exam: Exam }) {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const date = new Intl.DateTimeFormat(i18n.language, { day: 'numeric', month: 'short' }).format(
    new Date(exam.date),
  );

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push({ pathname: '/exams/[id]', params: { id: exam.id } })}
    >
      <ThemedView type="backgroundElement" style={styles.row}>
        <View style={styles.rowText}>
          <ThemedText type="smallBold">{exam.name}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {date}
          </ThemedText>
        </View>
        {exam.score === null ? (
          <View style={[styles.badge, { borderColor: theme.primary }]}>
            <ThemedText type="small" style={{ color: theme.primary }}>
              {t('exams.upcoming')}
            </ThemedText>
          </View>
        ) : (
          <ThemedText type="smallBold" style={{ color: theme[scoreColorKey(exam.score)] }}>
            {exam.score}%
          </ThemedText>
        )}
      </ThemedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  swatch: { width: 56, height: 56, borderRadius: Spacing.two },
  headerText: { flex: 1, gap: Spacing.half },
  progressBlock: { gap: Spacing.two },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  track: { height: 6, borderRadius: 3, overflow: 'hidden' },
  fill: { height: 6, borderRadius: 3 },
  section: { gap: Spacing.two },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  list: { gap: Spacing.two },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: { flex: 1, gap: Spacing.half },
  badge: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: 999,
    borderWidth: 1,
  },
});
