import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { JobsTabScreen } from '../../src/features/jobs/JobsTabScreen';
import { getSupabaseClient } from '../../src/lib/supabase';
import { SupabaseJobsRepository } from '../../src/repositories/SupabaseJobsRepository';

export default function JobsRoute() {
  const router = useRouter();
  const repo = useMemo(() => new SupabaseJobsRepository(getSupabaseClient()), []);
  return (
    <JobsTabScreen
      repo={repo}
      onOpenJob={(id) => router.push(`/jobs/${id}` as never)}
      onOpenDay={(date) => router.push(`/day/${date}` as never)}
    />
  );
}
