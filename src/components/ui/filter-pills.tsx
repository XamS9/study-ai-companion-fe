import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type FilterPillsProps<T extends string> = {
  value: T;
  options: readonly T[];
  onChange: (value: T) => void;
  /** i18n key prefix; each option's label resolves to `${tPrefix}.${option}`. */
  tPrefix: string;
};

/** Single-select rounded pill row used to filter a list (subjects, exams, …). */
export function FilterPills<T extends string>({
  value,
  options,
  onChange,
  tPrefix,
}: FilterPillsProps<T>) {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <View style={styles.row}>
      {options.map((option) => {
        const active = value === option;
        return (
          <Pressable
            key={option}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(option)}
            style={[
              styles.pill,
              {
                backgroundColor: active ? theme.primary : theme.backgroundElement,
                borderColor: active ? theme.primary : theme.border,
              },
            ]}
          >
            <ThemedText
              type="small"
              style={{ color: active ? theme.primaryText : theme.textSecondary }}
            >
              {t(`${tPrefix}.${option}`)}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: Spacing.two },
  pill: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: 999,
    borderWidth: 1,
  },
});
