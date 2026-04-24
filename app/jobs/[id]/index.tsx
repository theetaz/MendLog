import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback } from 'react';
import { JobDetailScreen } from '../../../src/features/jobs/JobDetailScreen';
import { deleteJob } from '../../../src/features/jobs/jobsApi';
import { useOptionalSync } from '../../../src/offline/syncManager';

export default function JobDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const syncCtx = useOptionalSync();

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
      // Fire-and-forget a data-lane sync so the tombstone reaches the server
      // right away — without this the user sees the sync badge sit on the
      // delete until the next debounced run (~30s) or AppState change.
      if (syncCtx?.online) {
        void syncCtx.triggerData();
      }
    },
    [router, syncCtx],
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
