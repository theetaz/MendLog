import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { useAuth } from '../src/features/auth/AuthProvider';
import { NewJobScreen } from '../src/features/jobs/NewJobScreen';
import { ComingSoon } from '../src/features/placeholder/ComingSoon';

export default function NewJobModal() {
  const router = useRouter();
  const { session } = useAuth();
  const userId = session?.user?.id ?? null;

  const handleClose = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)');
  }, [router]);

  if (!userId) {
    return (
      <ComingSoon
        title="New job"
        blurb="Sign in to start capturing a new job."
      />
    );
  }

  return <NewJobScreen userId={userId} onClose={handleClose} />;
}
