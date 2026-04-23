import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { JobsTabScreen } from '../../src/features/jobs/JobsTabScreen';
import { OfflineJobsRepository } from '../../src/offline/repos/OfflineJobsRepository';

export default function JobsRoute() {
  const router = useRouter();
  const repo = useMemo(() => new OfflineJobsRepository(), []);
  return (
    <JobsTabScreen
      repo={repo}
      onOpenJob={(id) => router.push(`/jobs/${id}` as never)}
      onOpenDay={(date) => router.push(`/day/${date}` as never)}
    />
  );
}
