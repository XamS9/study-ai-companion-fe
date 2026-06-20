import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Screen } from '@/components/ui/screen';
import { Spacing } from '@/constants/theme';
import { useAvatarUrl } from '@/hooks/use-avatar-url';
import { useTheme } from '@/hooks/use-theme';
import { uploadAvatar } from '@/lib/storage';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth';

export default function EditProfileScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);
  const refreshProfile = useAuthStore((s) => s.refreshProfile);

  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const avatarUrl = useAvatarUrl(profile?.avatar_url);

  const pickPhoto = async () => {
    if (!user) return;
    setError(null);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: true,
    });
    if (result.canceled) return;

    const asset = result.assets[0];
    if (!asset?.base64) return;

    setUploading(true);
    try {
      const path = await uploadAvatar(user.id, asset.base64, asset.mimeType ?? 'image/jpeg');
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: path, updated_at: new Date().toISOString() })
        .eq('id', user.id);
      if (error) throw error;
      await refreshProfile();
      Alert.alert(t('profile.photoUpdated'));
    } catch (e) {
      setError(e instanceof Error ? e.message : t('auth.genericError'));
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    if (!user) return;
    setError(null);
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName.trim(), updated_at: new Date().toISOString() })
      .eq('id', user.id);
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    await refreshProfile();
    router.back();
  };

  return (
    <Screen>
      <View style={styles.photo}>
        <Pressable onPress={pickPhoto} disabled={uploading} accessibilityRole="button">
          <Avatar uri={avatarUrl} name={fullName || profile?.full_name} size={112} />
        </Pressable>
        <Button
          title={t('profile.changePhoto')}
          variant="ghost"
          onPress={pickPhoto}
          loading={uploading}
        />
      </View>

      <Field
        label={t('common.fullName')}
        value={fullName}
        onChangeText={setFullName}
        autoCapitalize="words"
      />

      {error ? (
        <ThemedText type="small" style={{ color: theme.error }}>
          {error}
        </ThemedText>
      ) : null}

      <Button
        title={saving ? t('common.saving') : t('common.save')}
        onPress={save}
        loading={saving}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  photo: { alignItems: 'center', gap: Spacing.one, paddingVertical: Spacing.three },
});
