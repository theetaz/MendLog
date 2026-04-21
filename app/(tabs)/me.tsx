import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { useAuth } from '../../src/features/auth/AuthProvider';
import { MeScreen } from '../../src/features/me/MeScreen';
import { getSupabaseClient } from '../../src/lib/supabase';
import { SupabaseJobsRepository } from '../../src/repositories/SupabaseJobsRepository';

export default function MeRoute() {
  const router = useRouter();
  const { session, signOut } = useAuth();
  const email = session?.user?.email ?? null;
  const displayName =
    (session?.user?.user_metadata?.full_name as string | undefined) ?? undefined;
  const memberSince = session?.user?.created_at ?? undefined;

  const repo = useMemo(() => new SupabaseJobsRepository(getSupabaseClient()), []);

  return (
    <MeScreen
      email={email}
      displayName={displayName}
      memberSince={memberSince}
      repo={repo}
      onSignOut={signOut}
      onOpenDay={(date) => router.push(`/day/${date}` as never)}
      onOpenJobs={() => router.push('/(tabs)/jobs' as never)}
    />
  );
}
