import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback } from 'react';
import { JobDetailScreen } from '../../../src/features/jobs/JobDetailScreen';

export default function JobDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const jobId = Number(id);

  const handleBack = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)');
  }, [router]);

  const handleEdit = useCallback(
    (id: number) => {
      router.push(`/jobs/${id}/edit` as never);
    },
    [router],
  );

  if (!Number.isFinite(jobId)) {
    return null;
  }
  return <JobDetailScreen jobId={jobId} onBack={handleBack} onEdit={handleEdit} />;
}
