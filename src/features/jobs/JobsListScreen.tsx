import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { JobCard } from '../../components/JobCard';
import { AppBar, Icon, SectionLabel } from '../../design/components';
import { fonts, spacing, type ThemeColors, useColors } from '../../design/tokens';
import type { JobsRepository } from '../../repositories/JobsRepository';
import type { Job } from '../../types/job';
import { addDaysLocal, localDateIso } from '../../utils/localDate';

interface JobsListScreenProps {
  repo: JobsRepository;
  clock?: () => Date;
  onOpenJob(id: string): void;
}

type Row = { kind: 'header'; key: string; label: string } | { kind: 'job'; key: string; job: Job };

export function JobsListScreen({ repo, clock = () => new Date(), onOpenJob }: JobsListScreenProps) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);
        const result = await repo.listJobs();
        setJobs(result);
        setError(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [repo],
  );

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  return (
    <View style={styles.container}>
      <AppBar title="Jobs" subtitle={jobs.length > 0 ? `${jobs.length} total` : undefined} />
      {loading && jobs.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.navy} />
        </View>
      ) : error && jobs.length === 0 ? (
        <View style={styles.center}>
          <Icon name="warning" size={28} color={colors.red} weight={2} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <JobsListBody
          jobs={jobs}
          clock={clock}
          refreshing={refreshing}
          onRefresh={() => load(true)}
          onOpenJob={onOpenJob}
        />
      )}
    </View>
  );
}

interface JobsListBodyProps {
  jobs: Job[];
  clock?: () => Date;
  refreshing: boolean;
  onRefresh(): void;
  onOpenJob(id: string): void;
}

export function JobsListBody({
  jobs,
  clock = () => new Date(),
  refreshing,
  onRefresh,
  onOpenJob,
}: JobsListBodyProps) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const rows = useMemo(() => groupByRelativeDate(jobs, clock()), [jobs, clock]);

  if (jobs.length === 0) {
    return (
      <View style={styles.center}>
        <Icon name="list" size={40} color={colors.mute} weight={1.5} />
        <Text style={styles.emptyText}>No jobs yet.</Text>
        <Text style={styles.emptyHint}>Tap + in the tab bar to capture your first one.</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={rows}
      keyExtractor={(row) => row.key}
      contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 120 }]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.navy} />
      }
      renderItem={({ item }) =>
        item.kind === 'header' ? (
          <View style={styles.headerWrap}>
            <SectionLabel>{item.label}</SectionLabel>
          </View>
        ) : (
          <JobCard
            job={item.job}
            variant="horizontal"
            onPress={() => onOpenJob(item.job.id)}
            testID={`jobs-list-card-${item.job.id}`}
          />
        )
      }
      ItemSeparatorComponent={() => <View style={styles.sep} />}
    />
  );
}

export function groupByRelativeDate(jobs: Job[], now: Date): Row[] {
  if (jobs.length === 0) return [];
  const today = localDateIso(now);
  const yesterday = localDateIso(addDaysLocal(now, -1));
  const weekStart = localDateIso(addDaysLocal(now, -7));
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

  const buckets: Record<string, Job[]> = {
    Today: [],
    Yesterday: [],
    'This week': [],
    'This month': [],
  };
  const olderByMonth = new Map<string, Job[]>();

  for (const job of jobs) {
    if (job.date === today) buckets.Today.push(job);
    else if (job.date === yesterday) buckets.Yesterday.push(job);
    else if (job.date >= weekStart) buckets['This week'].push(job);
    else if (job.date >= monthStart) buckets['This month'].push(job);
    else {
      const key = job.date.slice(0, 7); // YYYY-MM
      const list = olderByMonth.get(key);
      if (list) list.push(job);
      else olderByMonth.set(key, [job]);
    }
  }

  const rows: Row[] = [];
  for (const label of ['Today', 'Yesterday', 'This week', 'This month'] as const) {
    const list = buckets[label];
    if (!list || list.length === 0) continue;
    rows.push({ kind: 'header', key: `h:${label}`, label });
    for (const job of list) rows.push({ kind: 'job', key: `j:${job.id}`, job });
  }

  const olderKeys = Array.from(olderByMonth.keys()).sort().reverse();
  for (const key of olderKeys) {
    const [y, m] = key.split('-').map(Number);
    const label = new Date(y, (m ?? 1) - 1, 1).toLocaleDateString(undefined, {
      month: 'long',
      year: 'numeric',
    });
    rows.push({ kind: 'header', key: `h:${key}`, label });
    for (const job of olderByMonth.get(key) ?? []) {
      rows.push({ kind: 'job', key: `j:${job.id}`, job });
    }
  }
  return rows;
}


const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: spacing.xl,
  },
  errorText: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.red,
    textAlign: 'center',
  },
  emptyText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 16,
    color: colors.text,
    marginTop: 4,
  },
  emptyHint: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.mute,
    textAlign: 'center',
  },
  list: {
    paddingHorizontal: spacing.xl,
  },
  headerWrap: {
    marginTop: 4,
  },
  sep: { height: spacing.sm },
});
