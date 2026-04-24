import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback } from 'react';
import { JobDetailScreen } from '../../../src/features/jobs/JobDetailScreen';
import { deleteJob } from '../../../src/features/jobs/jobsApi';

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

  const handleDelete = useCallback(
    async (jobId: string) => {
      // Soft-delete locally; the sync engine drains the tombstone to the server.
      await deleteJob(jobId);
      if (router.canGoBack()) router.back();
      else router.replace('/(tabs)');
    },
    [router],
  );

  if (!id) return null;
  return (
    <JobDetailScreen
      jobId={id}
      onBack={handleBack}
      onEdit={handleEdit}
      onDelete={handleDelete}
    />
  );
}
