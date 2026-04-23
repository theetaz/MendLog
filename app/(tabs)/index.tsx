import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { useAuth } from '../../src/features/auth/AuthProvider';
import { HomeScreen } from '../../src/features/home/HomeScreen';
import { OfflineJobsRepository } from '../../src/offline/repos/OfflineJobsRepository';

export default function HomeRoute() {
  const router = useRouter();
  const { session } = useAuth();
  const repo = useMemo(() => new OfflineJobsRepository(), []);

  const displayName =
    (session?.user?.user_metadata?.full_name as string | undefined) ??
    session?.user?.email?.split('@')[0] ??
    'there';

  return (
    <HomeScreen
      repo={repo}
      userName={displayName}
      onOpenJob={(id) => router.push(`/jobs/${id}` as never)}
      onOpenDay={(date) => router.push(`/day/${date}` as never)}
    />
  );
}
