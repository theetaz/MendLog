import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback } from 'react';
import { useAuth } from '../../../src/features/auth/AuthProvider';
import { JobEditScreen } from '../../../src/features/jobs/JobEditScreen';

export default function JobEditRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { session } = useAuth();
  const userId = session?.user?.id ?? null;

  const handleClose = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace(`/jobs/${id}` as never);
  }, [router, id]);

  const handleDeleted = useCallback(() => {
    router.replace('/(tabs)/jobs' as never);
  }, [router]);

  if (!id || !userId) return null;
  return (
    <JobEditScreen
      jobId={id}
      userId={userId}
      onClose={handleClose}
      onDeleted={handleDeleted}
    />
  );
}
