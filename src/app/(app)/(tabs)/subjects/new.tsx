import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useCreateSubject } from '@/api/subjects';
import { SubjectForm, type SubjectFormValues } from '@/components/subject-form';
import { Screen } from '@/components/ui/screen';

export default function NewSubjectScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { mutateAsync, isPending, error } = useCreateSubject();

  const create = async (values: SubjectFormValues) => {
    await mutateAsync(values);
    router.back();
  };

  return (
    <Screen>
      <SubjectForm
        submitLabel={t('subjects.new.create')}
        onSubmit={create}
        isPending={isPending}
        error={error as Error | null}
      />
    </Screen>
  );
}
