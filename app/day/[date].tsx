import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo } from 'react';
import { DayViewScreen } from '../../src/features/jobs/DayViewScreen';
import { OfflineJobsRepository } from '../../src/offline/repos/OfflineJobsRepository';

export default function DayViewRoute() {
  const { date } = useLocalSearchParams<{ date: string }>();
  const router = useRouter();
  const repo = useMemo(() => new OfflineJobsRepository(), []);

  const handleBack = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)');
  }, [router]);

  if (!date) return null;
  return (
    <DayViewScreen
      repo={repo}
      dateIso={String(date)}
      onBack={handleBack}
      onOpenJob={(id) => router.push(`/jobs/${id}` as never)}
      onNavigateDay={(iso) => router.replace(`/day/${iso}` as never)}
    />
  );
}
