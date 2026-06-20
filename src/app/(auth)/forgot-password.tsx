import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Screen } from '@/components/ui/screen';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { resetPasswordRedirect } from '@/lib/auth-oauth';
import { supabase } from '@/lib/supabase';

export default function ForgotPasswordScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const sendLink = async () => {
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: resetPasswordRedirect,
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setSent(true);
  };

  return (
    <Screen>
      <View style={styles.header}>
        <ThemedText type="subtitle">{t('auth.forgotTitle')}</ThemedText>
        <ThemedText themeColor="textSecondary">{t('auth.forgotSubtitle')}</ThemedText>
      </View>

      <Field
        label={t('common.email')}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
        textContentType="emailAddress"
      />

      {error ? (
        <ThemedText type="small" style={{ color: theme.error }}>
          {error}
        </ThemedText>
      ) : null}
      {sent ? (
        <ThemedText type="small" style={{ color: theme.success }}>
          {t('auth.resetLinkSent')}
        </ThemedText>
      ) : null}

      <Button
        title={t('auth.sendResetLink')}
        onPress={sendLink}
        loading={loading}
        disabled={!email}
      />
      <Button title={t('common.back')} variant="ghost" onPress={() => router.back()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: Spacing.one, marginBottom: Spacing.two },
});
