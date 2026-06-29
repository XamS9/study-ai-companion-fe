import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useSubject, useUpdateSubject } from '@/api/subjects';
import { SubjectForm, type SubjectFormValues } from '@/components/subject-form';
import { AsyncContent } from '@/components/ui/async-content';
import { Screen } from '@/components/ui/screen';

export default function EditSubjectScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const router = useRouter();
  const { data: subject, isLoading, error, refetch } = useSubject(id);
  const { mutateAsync, isPending, error: saveError } = useUpdateSubject(id);

  const save = async (values: SubjectFormValues) => {
    await mutateAsync(values);
    router.back();
  };

  return (
    <Screen>
      <AsyncContent isLoading={isLoading} error={error as Error | null} onRetry={refetch}>
        {subject ? (
          <SubjectForm
            submitLabel={t('common.save')}
            onSubmit={save}
            showProgress
            isPending={isPending}
            error={saveError as Error | null}
            initial={{
              name: subject.name,
              code: subject.code ?? '',
              description: subject.description ?? '',
              color: subject.color,
              progress: subject.progress,
            }}
          />
        ) : null}
      </AsyncContent>
    </Screen>
  );
}
