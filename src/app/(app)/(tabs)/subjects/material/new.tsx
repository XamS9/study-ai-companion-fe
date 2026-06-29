import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, Pressable, StyleSheet, View } from 'react-native';

import { useCreateMaterial } from '@/api/materials';
import type { MaterialType } from '@/api/types';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { FilterPills } from '@/components/ui/filter-pills';
import { Screen } from '@/components/ui/screen';
import { Spacing } from '@/constants/theme';
import { useMaterialAttachment } from '@/hooks/use-material-attachment';
import { useTheme } from '@/hooks/use-theme';
import { uploadMaterialFile } from '@/lib/storage';
import { useAuthStore } from '@/store/auth';

const TYPES: MaterialType[] = ['note', 'pdf', 'image'];

export default function NewMaterialScreen() {
  const { subjectId } = useLocalSearchParams<{ subjectId: string }>();
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [title, setTitle] = useState('');
  const [type, setType] = useState<MaterialType>('note');
  const [pages, setPages] = useState('');
  const [content, setContent] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const { mutateAsync, isPending, error } = useCreateMaterial();
  const attach = useMaterialAttachment();

  // Switching type drops a file picked under the previous type so we never upload
  // a PDF for an image material (or vice versa).
  const changeType = (next: MaterialType) => {
    setType(next);
    attach.clear();
  };

  const onPick = async (pick: () => Promise<{ ocrText: string | null }>) => {
    const { ocrText } = await pick();
    // Only overwrite an empty content field, so OCR never clobbers typed text.
    if (ocrText && !content.trim()) setContent(ocrText);
  };

  const create = async () => {
    if (!user) return;
    setUploadError(null);

    let fileUrl: string | undefined;
    if (attach.attachment) {
      setUploading(true);
      try {
        fileUrl = await uploadMaterialFile(
          user.id,
          attach.attachment.uri,
          attach.attachment.mimeType,
        );
      } catch (e) {
        setUploadError(e instanceof Error ? e.message : t('auth.genericError'));
        return;
      } finally {
        setUploading(false);
      }
    }

    const parsedPages = parseInt(pages, 10);
    await mutateAsync({
      subjectId,
      title: title.trim(),
      type,
      pages: type !== 'note' && Number.isFinite(parsedPages) ? parsedPages : null,
      content: content.trim() || undefined,
      fileUrl,
    });
    router.back();
  };

  return (
    <Screen>
      <Field
        label={t('materials.new.titleLabel')}
        value={title}
        onChangeText={setTitle}
        placeholder={t('materials.new.titlePlaceholder')}
        autoCapitalize="sentences"
      />

      <ThemedText type="small" themeColor="textSecondary">
        {t('materials.new.typeLabel')}
      </ThemedText>
      <FilterPills value={type} options={TYPES} onChange={changeType} tPrefix="materials.types" />

      {type === 'image' ? (
        <View style={styles.attachActions}>
          <Button
            title={t('materials.new.pickImage')}
            variant="secondary"
            onPress={() => onPick(attach.pickImage)}
            loading={attach.busy}
            style={styles.attachButton}
          />
          <Button
            title={t('materials.new.takePhoto')}
            variant="secondary"
            onPress={() => onPick(attach.takePhoto)}
            loading={attach.busy}
            style={styles.attachButton}
          />
        </View>
      ) : null}

      {type === 'pdf' ? (
        <Button
          title={t('materials.new.pickPdf')}
          variant="secondary"
          onPress={() => onPick(attach.pickPdf)}
          loading={attach.busy}
        />
      ) : null}

      {attach.attachment ? (
        <ThemedView type="backgroundElement" style={styles.attachment}>
          {type === 'image' ? (
            <Image source={{ uri: attach.attachment.uri }} style={styles.thumb} />
          ) : (
            <ThemedText type="subtitle" style={styles.fileGlyph}>
              ▤
            </ThemedText>
          )}
          <ThemedText type="small" style={styles.fileName} numberOfLines={1}>
            {attach.attachment.name}
          </ThemedText>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('common.delete')}
            onPress={attach.clear}
            hitSlop={8}
          >
            <ThemedText type="small" themeColor="error">
              {t('common.delete')}
            </ThemedText>
          </Pressable>
        </ThemedView>
      ) : null}

      {attach.ocrError ? (
        <ThemedText type="small" themeColor="textSecondary">
          {t('materials.new.ocrUnavailable')}
        </ThemedText>
      ) : null}

      {type !== 'note' ? (
        <Field
          label={t('materials.new.pagesLabel')}
          value={pages}
          onChangeText={setPages}
          keyboardType="number-pad"
          placeholder="0"
        />
      ) : null}

      <Field
        label={t(type === 'pdf' ? 'materials.new.contentLabelOptional' : 'materials.new.contentLabel')}
        value={content}
        onChangeText={setContent}
        placeholder={t(type === 'pdf' ? 'materials.new.contentPlaceholderPdf' : 'materials.new.contentPlaceholder')}
        multiline
        style={styles.content}
      />

      {error || uploadError ? (
        <ThemedText type="small" style={{ color: theme.error }}>
          {uploadError ?? (error as Error).message}
        </ThemedText>
      ) : null}

      <Button
        title={t('materials.new.create')}
        onPress={create}
        loading={uploading || isPending}
        disabled={!title.trim()}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { minHeight: 140, paddingTop: Spacing.three, textAlignVertical: 'top' },
  attachActions: { flexDirection: 'row', gap: Spacing.two },
  attachButton: { flex: 1 },
  attachment: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
  thumb: { width: 48, height: 48, borderRadius: Spacing.two },
  fileGlyph: { width: 48, textAlign: 'center' },
  fileName: { flex: 1 },
});
