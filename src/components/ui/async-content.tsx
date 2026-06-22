import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  isLoading: boolean;
  error?: Error | null;
  isEmpty?: boolean;
  emptyText?: string;
  onRetry?: () => void;
  children: ReactNode;
};

/** Standard loading / error / empty states for a data-backed screen section. */
export function AsyncContent({ isLoading, error, isEmpty, emptyText, onRetry, children }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();

  if (isLoading) {
    return <ActivityIndicator style={styles.center} color={theme.primary} />;
  }
  if (error) {
    return (
      <View style={styles.center}>
        <ThemedText type="small" style={[styles.message, { color: theme.error }]}>
          {error.message}
        </ThemedText>
        {onRetry ? (
          <Button title={t('common.retry')} variant="secondary" onPress={onRetry} />
        ) : null}
      </View>
    );
  }
  if (isEmpty) {
    return (
      <ThemedText type="small" themeColor="textSecondary" style={styles.empty}>
        {emptyText}
      </ThemedText>
    );
  }
  return <>{children}</>;
}

const styles = StyleSheet.create({
  center: { paddingVertical: Spacing.five, alignItems: 'center', gap: Spacing.three },
  message: { textAlign: 'center' },
  empty: { marginTop: Spacing.two, textAlign: 'center' },
});
