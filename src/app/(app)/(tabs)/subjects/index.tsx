import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { useSubjects } from '@/api/subjects';
import type { Subject } from '@/api/types';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AsyncContent } from '@/components/ui/async-content';
import { FilterPills } from '@/components/ui/filter-pills';
import { Screen } from '@/components/ui/screen';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Filter = 'all' | 'active' | 'completed';
const FILTERS: Filter[] = ['all', 'active', 'completed'];

export default function SubjectsScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const { data, isLoading, error, refetch } = useSubjects();

  const subjects = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (data ?? []).filter((s) => {
      const matchesQuery = !q || s.name.toLowerCase().includes(q);
      const completed = s.progress >= 100;
      const matchesFilter =
        filter === 'all' || (filter === 'completed' ? completed : !completed);
      return matchesQuery && matchesFilter;
    });
  }, [data, query, filter]);

  return (
    <Screen>
      <View style={styles.headerRow}>
        <ThemedText type="subtitle">{t('subjects.title')}</ThemedText>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('subjects.addSubject')}
          onPress={() => router.push('/subjects/new')}
          style={[styles.addButton, { backgroundColor: theme.primary }]}
        >
          <Ionicons name="add" size={22} color={theme.primaryText} />
        </Pressable>
      </View>

      <View
        style={[
          styles.search,
          { backgroundColor: theme.inputBackground, borderColor: theme.border },
        ]}
      >
        <Ionicons name="search-outline" size={18} color={theme.textSecondary} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={t('subjects.search')}
          placeholderTextColor={theme.textSecondary}
          style={[styles.searchInput, { color: theme.text }]}
          autoCapitalize="none"
          returnKeyType="search"
        />
      </View>

      <FilterPills value={filter} options={FILTERS} onChange={setFilter} tPrefix="subjects.filter" />

      <AsyncContent
        isLoading={isLoading}
        error={error as Error | null}
        isEmpty={subjects.length === 0}
        emptyText={t('subjects.empty')}
        onRetry={refetch}
      >
        <View style={styles.list}>
          {subjects.map((s) => (
            <SubjectCard key={s.id} subject={s} />
          ))}
        </View>
      </AsyncContent>
    </Screen>
  );
}

function SubjectCard({ subject }: { subject: Subject }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const color = theme[subject.color];

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push({ pathname: '/subjects/[id]', params: { id: subject.id } })}
    >
      <ThemedView type="backgroundElement" style={styles.card}>
        <View style={styles.cardBody}>
          <View style={[styles.swatch, { backgroundColor: `${color}55` }]} />
          <View style={styles.cardText}>
            <ThemedText type="smallBold">{subject.name}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {subject.code ? `${subject.code} · ` : ''}
              {t('subjects.materials', { count: subject.materialsCount })} ·{' '}
              {t('subjects.exams', { count: subject.examsCount })}
            </ThemedText>
          </View>
          <ThemedText type="smallBold" style={{ color }}>
            {subject.progress}%
          </ThemedText>
        </View>
        <View style={[styles.track, { backgroundColor: theme.backgroundSelected }]}>
          <View
            style={[styles.fill, { width: `${subject.progress}%`, backgroundColor: color }]}
          />
        </View>
      </ThemedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    minHeight: 44,
    borderRadius: Spacing.three,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
  },
  searchInput: { flex: 1, fontSize: 16, paddingVertical: Spacing.two },
  list: { gap: Spacing.two },
  card: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
    gap: Spacing.three,
  },
  cardBody: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  swatch: { width: 48, height: 48, borderRadius: Spacing.two },
  cardText: { flex: 1, gap: Spacing.half },
  track: { height: 4, borderRadius: 2, overflow: 'hidden' },
  fill: { height: 4, borderRadius: 2 },
  empty: { marginTop: Spacing.two, textAlign: 'center' },
});
