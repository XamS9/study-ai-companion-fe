import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useRef, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { useExams } from '@/api/exams';
import { useSubjects } from '@/api/subjects';
import type { Exam, Subject } from '@/api/types';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AsyncContent } from '@/components/ui/async-content';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { scoreColorKey } from '@/lib/score';

type Filter = 'all' | 'completed' | 'failed' | 'success';
const FILTERS: Filter[] = ['all', 'completed', 'failed', 'success'];

type DropdownLayout = { top: number; right: number };

type FilterDropdownProps = {
  value: Filter;
  onChange: (v: Filter) => void;
};

function FilterDropdown({ value, onChange }: FilterDropdownProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [layout, setLayout] = useState<DropdownLayout | null>(null);
  const btnRef = useRef<View>(null);

  const openMenu = () => {
    btnRef.current?.measure((_x, _y, width, height, pageX, pageY) => {
      setLayout({ top: pageY + height + 4, right: -(pageX + width) });
      setOpen(true);
    });
  };

  const select = (f: Filter) => {
    onChange(f);
    setOpen(false);
  };

  const isAll = value === 'all';

  return (
    <>
      <Pressable
        ref={btnRef}
        accessibilityRole="button"
        accessibilityLabel={t('exams.filter.label')}
        onPress={openMenu}
        style={[
          styles.trigger,
          {
            backgroundColor: isAll ? theme.backgroundElement : theme.primary,
            borderColor: isAll ? theme.border : theme.primary,
          },
        ]}
      >
        <Ionicons
          name="funnel-outline"
          size={14}
          color={isAll ? theme.textSecondary : theme.primaryText}
        />
        <ThemedText
          type="small"
          style={{ color: isAll ? theme.textSecondary : theme.primaryText }}
        >
          {t(`exams.filter.${value}`)}
        </ThemedText>
        <Ionicons
          name={open ? 'chevron-up' : 'chevron-down'}
          size={12}
          color={isAll ? theme.textSecondary : theme.primaryText}
        />
      </Pressable>

      <Modal visible={open} transparent animationType="none" onRequestClose={() => setOpen(false)}>
        <Pressable style={StyleSheet.absoluteFill} onPress={() => setOpen(false)} />
        {layout && (
          <View
            style={[
              styles.menu,
              {
                top: layout.top,
                right: 16,
                backgroundColor: theme.backgroundElement,
                borderColor: theme.border,
                shadowColor: theme.text,
              },
            ]}
          >
            {FILTERS.map((f) => {
              const active = value === f;
              return (
                <Pressable
                  key={f}
                  accessibilityRole="menuitem"
                  accessibilityState={{ selected: active }}
                  onPress={() => select(f)}
                  style={[styles.option, active && { backgroundColor: theme.backgroundSelected }]}
                >
                  <ThemedText
                    type="small"
                    style={{ color: active ? theme.primary : theme.text, flex: 1 }}
                  >
                    {t(`exams.filter.${f}`)}
                  </ThemedText>
                  {active && (
                    <Ionicons name="checkmark" size={14} color={theme.primary} />
                  )}
                </Pressable>
              );
            })}
          </View>
        )}
      </Modal>
    </>
  );
}

export default function ExamsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>('all');
  const { data: examData, isLoading, error, refetch } = useExams();
  const { data: subjectData } = useSubjects();

  const subjectsById = useMemo(
    () => new Map((subjectData ?? []).map((s) => [s.id, s])),
    [subjectData],
  );

  const exams = useMemo(() => {
    return (examData ?? []).filter((e) => {
      if (filter === 'completed') return e.score !== null;
      if (filter === 'failed') return e.score !== null && e.score < 70;
      if (filter === 'success') return e.score !== null && e.score >= 70;
      return true;
    });
  }, [examData, filter]);

  return (
    <Screen>
      <View style={styles.headerRow}>
        <ThemedText type="subtitle">{t('exams.title')}</ThemedText>
        <View style={styles.headerActions}>
          <FilterDropdown value={filter} onChange={setFilter} />
          <Button title={t('exams.new.create')} onPress={() => router.push('/exams/new')} />
        </View>
      </View>

      <AsyncContent
        isLoading={isLoading}
        error={error as Error | null}
        isEmpty={exams.length === 0}
        emptyText={t('exams.empty')}
        onRetry={refetch}
      >
        <View style={styles.list}>
          {exams.map((e) => (
            <ExamCard key={e.id} exam={e} subject={subjectsById.get(e.subjectId)} />
          ))}
        </View>
      </AsyncContent>
    </Screen>
  );
}

function ExamCard({ exam, subject }: { exam: Exam; subject?: Subject }) {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const swatch = theme[subject?.color ?? 'primary'];
  const date = new Intl.DateTimeFormat(i18n.language, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(exam.date));

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push({ pathname: '/exams/[id]', params: { id: exam.id } })}
    >
      <ThemedView type="backgroundElement" style={styles.card}>
        <View style={[styles.swatch, { backgroundColor: `${swatch}55` }]} />
        <View style={styles.cardText}>
          <ThemedText type="smallBold">{exam.name}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {subject?.name ? `${subject.name} · ` : ''}
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
    borderRadius: 999,
    borderWidth: 1,
  },
  menu: {
    position: 'absolute',
    minWidth: 160,
    borderRadius: Spacing.two,
    borderWidth: 1,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 100,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    gap: Spacing.two,
  },
  list: { gap: Spacing.two },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
  swatch: { width: 48, height: 48, borderRadius: Spacing.two },
  cardText: { flex: 1, gap: Spacing.half },
  badge: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: 999,
    borderWidth: 1,
  },
});
