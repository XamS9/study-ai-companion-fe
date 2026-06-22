import { Link } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Screen } from '@/components/ui/screen';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { signInWithProvider, type OAuthProvider } from '@/lib/auth-oauth';
import { supabase } from '@/lib/supabase';

// Flip `enabled` to true once the provider is configured in the Supabase dashboard.
// GitHub is still deferred; Google and Microsoft (azure) are configured in Supabase.
const PROVIDERS: { id: OAuthProvider; label: string; enabled: boolean }[] = [
  { id: 'google', label: 'Google', enabled: true },
  { id: 'github', label: 'GitHub', enabled: false },
  { id: 'azure', label: 'Microsoft', enabled: true },
];

const ENABLED_PROVIDERS = PROVIDERS.filter((p) => p.enabled);

export default function LoginScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [oauthBusy, setOauthBusy] = useState<OAuthProvider | null>(null);
  const [error, setError] = useState<string | null>(null);

  const signIn = async () => {
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    if (error) setError(error.message);
  };

  const oauth = async (provider: OAuthProvider) => {
    setError(null);
    setOauthBusy(provider);
    try {
      await signInWithProvider(provider);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('auth.genericError'));
    } finally {
      setOauthBusy(null);
    }
  };

  return (
    <Screen>
      <View style={styles.header}>
        <ThemedText type="subtitle">{t('auth.loginTitle')}</ThemedText>
        <ThemedText themeColor="textSecondary">{t('auth.loginSubtitle')}</ThemedText>
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
      <Field
        label={t('common.password')}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="password"
        textContentType="password"
      />

      <Link href="/(auth)/forgot-password" style={styles.forgot}>
        <ThemedText type="link" themeColor="primary">
          {t('auth.forgotPassword')}
        </ThemedText>
      </Link>

      {error ? (
        <ThemedText type="small" style={{ color: theme.error }}>
          {error}
        </ThemedText>
      ) : null}

      <Button
        title={loading ? t('auth.signingIn') : t('auth.signIn')}
        onPress={signIn}
        loading={loading}
        disabled={!email || !password}
      />

      {ENABLED_PROVIDERS.length > 0 ? (
        <>
          <View style={styles.dividerRow}>
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
            <ThemedText type="small" themeColor="textSecondary">
              {t('common.or')}
            </ThemedText>
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
          </View>

          {ENABLED_PROVIDERS.map((p) => (
            <Button
              key={p.id}
              title={t('auth.continueWith', { provider: p.label })}
              variant="secondary"
              onPress={() => oauth(p.id)}
              loading={oauthBusy === p.id}
              disabled={oauthBusy !== null}
            />
          ))}
        </>
      ) : null}

      <View style={styles.footer}>
        <ThemedText type="small" themeColor="textSecondary">
          {t('auth.noAccount')}{' '}
        </ThemedText>
        <Link href="/(auth)/register">
          <ThemedText type="smallBold" themeColor="primary">
            {t('auth.signUp')}
          </ThemedText>
        </Link>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: Spacing.one, marginBottom: Spacing.two },
  forgot: { alignSelf: 'flex-end' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  divider: { flex: 1, height: 1 },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
});
