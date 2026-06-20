import { Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Screen } from '@/components/ui/screen';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { redirectTo } from '@/lib/auth-oauth';
import { supabase } from '@/lib/supabase';

export default function RegisterScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const register = async () => {
    setError(null);
    if (password.length < 6) {
      setError(t('auth.passwordTooShort'));
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { full_name: fullName.trim() },
        emailRedirectTo: redirectTo,
      },
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push({ pathname: '/(auth)/verify-email', params: { email: email.trim() } });
  };

  return (
    <Screen>
      <View style={styles.header}>
        <ThemedText type="subtitle">{t('auth.registerTitle')}</ThemedText>
        <ThemedText themeColor="textSecondary">{t('auth.registerSubtitle')}</ThemedText>
      </View>

      <Field
        label={t('common.fullName')}
        value={fullName}
        onChangeText={setFullName}
        autoCapitalize="words"
        autoComplete="name"
        textContentType="name"
      />
      <Field
        label={t('common.email')}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
        textContentType="emailAddress"
      />
      <Field
        label={t('common.password')}
        value={password}
        onChangeText={setPassword}
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
        title={loading ? t('auth.creatingAccount') : t('auth.createAccount')}
        onPress={register}
        loading={loading}
        disabled={!email || !password || !fullName}
      />

      <View style={styles.footer}>
        <ThemedText type="small" themeColor="textSecondary">
          {t('auth.haveAccount')}{' '}
        </ThemedText>
        <Link href="/(auth)/login">
          <ThemedText type="smallBold" themeColor="primary">
            {t('auth.signIn')}
          </ThemedText>
        </Link>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: Spacing.one, marginBottom: Spacing.two },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
});
