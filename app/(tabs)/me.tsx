import { useRouter } from 'expo-router';
import { useCallback, useMemo } from 'react';
import { useAuth } from '../../src/features/auth/AuthProvider';
import { MeScreen } from '../../src/features/me/MeScreen';
import { getSupabaseClient } from '../../src/lib/supabase';
import { OfflineJobsRepository } from '../../src/offline/repos/OfflineJobsRepository';

export default function MeRoute() {
  const router = useRouter();
  const { session, signOut } = useAuth();
  const email = session?.user?.email ?? null;
  const displayName =
    (session?.user?.user_metadata?.full_name as string | undefined) ?? undefined;
  const memberSince = session?.user?.created_at ?? undefined;

  const client = useMemo(() => getSupabaseClient(), []);
  const repo = useMemo(() => new OfflineJobsRepository(), []);

  const handleUpdateDisplayName = useCallback(
    async (name: string) => {
      const { error } = await client.auth.updateUser({ data: { full_name: name } });
      if (error) throw new Error(error.message);
    },
    [client],
  );

  return (
    <MeScreen
      email={email}
      displayName={displayName}
      memberSince={memberSince}
      repo={repo}
      onSignOut={signOut}
      onOpenJobs={() => router.push('/(tabs)/jobs' as never)}
      onUpdateDisplayName={handleUpdateDisplayName}
    />
  );
}
