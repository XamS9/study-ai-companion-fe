import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { Spacing } from '@/constants/theme';
import { useAvatarUrl } from '@/hooks/use-avatar-url';
import { useAuthStore } from '@/store/auth';

export default function ProfileScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const profile = useAuthStore((s) => s.profile);
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const avatarUrl = useAvatarUrl(profile?.avatar_url);

  return (
    <Screen>
      <View style={styles.header}>
        <Avatar uri={avatarUrl} name={profile?.full_name} size={112} />
        <ThemedText type="subtitle" style={styles.name}>
          {profile?.full_name || t('profile.noName')}
        </ThemedText>
        <ThemedText themeColor="textSecondary">{user?.email}</ThemedText>
      </View>

      <View style={styles.actions}>
        <Button title={t('profile.edit')} onPress={() => router.push('/(app)/profile/edit')} />
        <Button
          title={t('profile.changePassword')}
          variant="secondary"
          onPress={() => router.push('/(app)/profile/change-password')}
        />
        <Button title={t('profile.signOut')} variant="ghost" onPress={signOut} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', gap: Spacing.two, paddingVertical: Spacing.four },
  name: { textAlign: 'center' },
  actions: { gap: Spacing.two },
});
