import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useLanguageStore, type Language } from '@/store/language';
import { useThemeStore, type ThemeMode } from '@/store/theme';

function OptionGroup<T extends string>({
  title,
  value,
  options,
  onSelect,
}: {
  title: string;
  value: T;
  options: { value: T; label: string }[];
  onSelect: (value: T) => void;
}) {
  const theme = useTheme();
  return (
    <View style={styles.group}>
      <ThemedText type="small" themeColor="textSecondary">
        {title}
      </ThemedText>
      <ThemedView type="backgroundElement" style={styles.options}>
        {options.map((opt) => {
          const selected = opt.value === value;
          return (
            <Pressable
              key={opt.value}
              onPress={() => onSelect(opt.value)}
              accessibilityRole="button"
              style={[styles.option, { backgroundColor: selected ? theme.primary : 'transparent' }]}
            >
              <ThemedText
                type="smallBold"
                style={{ color: selected ? theme.primaryText : theme.text }}
              >
                {opt.label}
              </ThemedText>
            </Pressable>
          );
        })}
      </ThemedView>
    </View>
  );
}

export default function SettingsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const mode = useThemeStore((s) => s.mode);
  const setMode = useThemeStore((s) => s.setMode);
  const language = useLanguageStore((s) => s.language);
  const setLanguage = useLanguageStore((s) => s.setLanguage);

  const themeOptions: { value: ThemeMode; label: string }[] = [
    { value: 'system', label: t('settings.themeSystem') },
    { value: 'light', label: t('settings.themeLight') },
    { value: 'dark', label: t('settings.themeDark') },
  ];

  const languageOptions: { value: Language; label: string }[] = [
    { value: 'en', label: t('settings.languageEnglish') },
    { value: 'es', label: t('settings.languageSpanish') },
  ];

  return (
    <Screen>
      <ThemedText type="small" themeColor="textSecondary">
        {t('settings.appearance')}
      </ThemedText>
      <OptionGroup
        title={t('settings.theme')}
        value={mode}
        options={themeOptions}
        onSelect={setMode}
      />
      <OptionGroup
        title={t('settings.language')}
        value={language}
        options={languageOptions}
        onSelect={setLanguage}
      />

      <View style={styles.group}>
        <ThemedText type="small" themeColor="textSecondary">
          {t('settings.developer')}
        </ThemedText>
        <Button
          title={t('settings.diagnostics')}
          variant="secondary"
          onPress={() => router.push('/diagnostics')}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  group: { gap: Spacing.two },
  options: {
    flexDirection: 'row',
    borderRadius: Spacing.three,
    padding: Spacing.half,
    gap: Spacing.half,
  },
  option: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.two,
    borderRadius: Spacing.two + 2,
  },
});
