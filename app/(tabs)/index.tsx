import { useMemo } from 'react';
import { useRouter } from 'expo-router';
import { HomeScreen } from '../../src/features/home/HomeScreen';
import { InMemoryJobsRepository } from '../../src/repositories/InMemoryJobsRepository';
import { SEED_JOBS, SEED_REFERENCE_DATE } from '../../src/data/seedJobs';

export default function HomeRoute() {
  const router = useRouter();
  const repo = useMemo(() => new InMemoryJobsRepository(SEED_JOBS, SEED_REFERENCE_DATE), []);

  return (
    <HomeScreen
      repo={repo}
      userName="Nuwan"
      clock={() => SEED_REFERENCE_DATE}
      onOpenJob={(id) => router.push(`/jobs/${id}` as never)}
      onOpenDay={(date) => router.push(`/day/${date}` as never)}
    />
  );
}
