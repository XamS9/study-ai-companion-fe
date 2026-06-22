import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native';

import { useCreateMaterial } from '@/api/materials';
import type { MaterialType } from '@/api/types';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { FilterPills } from '@/components/ui/filter-pills';
import { Screen } from '@/components/ui/screen';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const TYPES: MaterialType[] = ['note', 'pdf', 'image'];

export default function NewMaterialScreen() {
  const { subjectId } = useLocalSearchParams<{ subjectId: string }>();
  const { t } = useTranslation();
  const theme = useTheme();
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [type, setType] = useState<MaterialType>('note');
  const [pages, setPages] = useState('');
  const [content, setContent] = useState('');
  const { mutateAsync, isPending, error } = useCreateMaterial();

  const create = async () => {
    const parsedPages = parseInt(pages, 10);
    await mutateAsync({
      subjectId,
      title: title.trim(),
      type,
      pages: type !== 'note' && Number.isFinite(parsedPages) ? parsedPages : null,
      content: content.trim() || undefined,
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
      <FilterPills value={type} options={TYPES} onChange={setType} tPrefix="materials.types" />

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
        label={t('materials.new.contentLabel')}
        value={content}
        onChangeText={setContent}
        placeholder={t('materials.new.contentPlaceholder')}
        multiline
        style={styles.content}
      />

      {error ? (
        <ThemedText type="small" style={{ color: theme.error }}>
          {(error as Error).message}
        </ThemedText>
      ) : null}

      <Button
        title={t('materials.new.create')}
        onPress={create}
        loading={isPending}
        disabled={!title.trim()}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { minHeight: 140, paddingTop: Spacing.three, textAlignVertical: 'top' },
});
