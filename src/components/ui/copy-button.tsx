import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useCopy } from '@/hooks/use-copy';
import { useTheme } from '@/hooks/use-theme';

type CopyButtonProps = {
  /** Text placed on the clipboard when pressed. */
  value: string;
  /** Accessibility label; defaults to the localized "Copy". */
  accessibilityLabel?: string;
};

/** Small text button that copies `value` and flips its label to "Copied" briefly. */
export const CopyButton = ({ value, accessibilityLabel }: CopyButtonProps) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const { copied, available, copy } = useCopy();

  // No native clipboard in this binary (Expo Go / pre-build) — hide rather than crash.
  if (!available) return null;

  return (
    <Pressable
      onPress={() => copy(value)}
      disabled={!value}
      hitSlop={Spacing.two}
      accessibilityRole="button"
      accessibilityState={{ disabled: !value }}
      accessibilityLabel={accessibilityLabel ?? t('common.copy')}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <ThemedText type="small" style={{ color: theme.primary }}>
        {copied ? t('common.copied') : t('common.copy')}
      </ThemedText>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: { paddingHorizontal: Spacing.two, paddingVertical: Spacing.half },
  pressed: { opacity: 0.6 },
});
