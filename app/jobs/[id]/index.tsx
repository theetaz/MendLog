import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback } from 'react';
import { JobDetailScreen } from '../../../src/features/jobs/JobDetailScreen';

export default function JobDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const handleBack = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)');
  }, [router]);

  const handleEdit = useCallback(
    (jobId: string) => {
      router.push(`/jobs/${jobId}/edit` as never);
    },
    [router],
  );

  if (!id) return null;
  return <JobDetailScreen jobId={id} onBack={handleBack} onEdit={handleEdit} />;
}
