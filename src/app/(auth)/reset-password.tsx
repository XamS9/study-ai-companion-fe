import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Screen } from '@/components/ui/screen';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { createSessionFromUrl } from '@/lib/auth-oauth';
import { supabase } from '@/lib/supabase';

export default function ResetPasswordScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const url = Linking.useURL();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Establish the recovery session from the link that opened this screen.
  useEffect(() => {
    if (!url) return;
    createSessionFromUrl(url).catch((e) => {
      setError(e instanceof Error ? e.message : t('auth.genericError'));
    });
  }, [url, t]);

  const update = async () => {
    setError(null);
    if (password.length < 6) {
      setError(t('auth.passwordTooShort'));
      return;
    }
    if (password !== confirm) {
      setError(t('auth.passwordsDontMatch'));
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setLoading(false);
      setError(error.message);
      return;
    }
    // Force a clean re-login with the new password.
    await supabase.auth.signOut();
    setLoading(false);
    router.replace('/(auth)/login');
  };

  return (
    <Screen>
      <View style={styles.header}>
        <ThemedText type="subtitle">{t('auth.resetTitle')}</ThemedText>
        <ThemedText themeColor="textSecondary">{t('auth.resetSubtitle')}</ThemedText>
      </View>

      <Field
        label={t('auth.newPassword')}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="password-new"
        textContentType="newPassword"
      />
      <Field
        label={t('auth.confirmPassword')}
        value={confirm}
        onChangeText={setConfirm}
        secureTextEntry
        autoComplete="password-new"
        textContentType="newPassword"
      />

      {error ? (
        <ThemedText type="small" style={{ color: theme.error }}>
          {error}
        </ThemedText>
      ) : null}

      <Button
        title={t('auth.updatePassword')}
        onPress={update}
        loading={loading}
        disabled={!password || !confirm}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: Spacing.one, marginBottom: Spacing.two },
});
