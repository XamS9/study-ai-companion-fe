import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { redirectTo } from '@/lib/auth-oauth';
import { supabase } from '@/lib/supabase';

export default function VerifyEmailScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email?: string }>();
  const [resending, setResending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const resend = async () => {
    if (!email) return;
    setNotice(null);
    setResending(true);
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: redirectTo },
    });
    setResending(false);
    setNotice(error ? error.message : t('auth.resetLinkSent'));
  };

  return (
    <Screen contentStyle={styles.center}>
      <View style={styles.body}>
        <ThemedText type="subtitle" style={styles.textCenter}>
          {t('auth.verifyTitle')}
        </ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.textCenter}>
          {t('auth.verifySubtitle', { email: email ?? '' })}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.textCenter}>
          {t('auth.verifyHint')}
        </ThemedText>

        {notice ? (
          <ThemedText type="small" style={[styles.textCenter, { color: theme.success }]}>
            {notice}
          </ThemedText>
        ) : null}
      </View>

      <View style={styles.actions}>
        <Button title={t('auth.iHaveConfirmed')} onPress={() => router.replace('/(auth)/login')} />
        <Button
          title={t('auth.resendEmail')}
          variant="ghost"
          onPress={resend}
          loading={resending}
          disabled={!email}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { justifyContent: 'space-between' },
  body: { gap: Spacing.three, paddingTop: Spacing.six },
  actions: { gap: Spacing.two },
  textCenter: { textAlign: 'center' },
});
