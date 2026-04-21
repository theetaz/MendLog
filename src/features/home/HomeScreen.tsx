import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppBar } from '../../design/components/AppBar';
import { Icon } from '../../design/components/Icon';
import { SectionLabel } from '../../design/components/SectionLabel';
import { colors, fonts, radii, spacing } from '../../design/tokens';
import { JobCard } from '../../components/JobCard';
import { MonthHeatmap } from '../../components/MonthHeatmap';
import type { JobsRepository } from '../../repositories/JobsRepository';
import { useHomeData } from './useHomeData';

const TODAY_PREVIEW_LIMIT = 3;

function todayIsoLocal(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

interface HomeScreenProps {
  repo: JobsRepository;
  userName: string;
  clock?: () => Date;
  onOpenJob?: (id: number) => void;
  onOpenDay?: (date: string) => void;
}

export function HomeScreen({
  repo,
  userName,
  clock = () => new Date(),
  onOpenJob,
  onOpenDay,
}: HomeScreenProps) {
  const data = useHomeData(repo, clock);
  const insets = useSafeAreaInsets();
  const todayIso = todayIsoLocal(clock());
  const visibleToday = data.today.slice(0, TODAY_PREVIEW_LIMIT);
  const hiddenCount = Math.max(0, data.today.length - visibleToday.length);

  const [refreshing, setRefreshing] = useState(false);

  // Refresh whenever Home regains focus (e.g. returning from New Job, Edit).
  useFocusEffect(
    useCallback(() => {
      data.reload();
    }, [data.reload]),
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    data.reload();
    // Let the data hook's loading flag indicate when fetch is done, but keep
    // the control visible for a minimum short beat so it doesn't flicker.
    setTimeout(() => setRefreshing(false), 350);
  }, [data]);

  const activityCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const day of data.activity) map.set(day.date, day.count);
    return map;
  }, [data.activity]);

  if (data.loading) {
    return (
      <View testID="home-loading" style={styles.loading}>
        <Text style={styles.loadingText}>Loading…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppBar title={`Hello, ${userName}`} />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.navy}
          />
        }
      >
        {data.error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{data.error.message}</Text>
          </View>
        )}

        <SectionLabel>Today</SectionLabel>
        <Text style={styles.todayCount}>
          {data.today.length} {data.today.length === 1 ? 'job' : 'jobs'} today
        </Text>
        <View style={styles.todayList}>
          {data.today.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No jobs yet today — tap + to start.</Text>
            </View>
          ) : (
            <>
              {visibleToday.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  variant="horizontal"
                  testID={`home-today-card-${job.id}`}
                  onPress={() => onOpenJob?.(job.id)}
                />
              ))}
              {hiddenCount > 0 && (
                <Pressable
                  testID="home-today-see-all"
                  onPress={() => onOpenDay?.(todayIso)}
                  style={({ pressed }) => [styles.seeAllBtn, pressed && styles.seeAllPressed]}
                >
                  <Text style={styles.seeAllText}>See all {data.today.length} jobs</Text>
                  <Icon name="home" size={14} color={colors.navy} weight={2} />
                </Pressable>
              )}
            </>
          )}
        </View>

        <SectionLabel>Activity · last 3 months</SectionLabel>
        <View style={styles.gridWrap}>
          <MonthHeatmap
            counts={activityCounts}
            clock={clock}
            onOpenDay={(date) => onOpenDay?.(date)}
          />
        </View>

        <SectionLabel>This week</SectionLabel>
        <View style={styles.statsRow}>
          <Stat label="Jobs" value={String(data.thisWeekCount)} />
          <Stat label="Avg idle" value={data.avgIdle} />
          <Stat label="Streak" value={String(data.streak)} suffix="days" />
        </View>
      </ScrollView>
    </View>
  );
}

function Stat({ label, value, suffix }: { label: string; value: string; suffix?: string }) {
  return (
    <View style={styles.statTile}>
      <Text style={styles.statLabel}>{label}</Text>
      <View style={styles.statValueRow}>
        <Text style={styles.statValue}>{value}</Text>
        {suffix && <Text style={styles.statSuffix}> {suffix}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: {
    paddingHorizontal: spacing.xl,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
  },
  loadingText: {
    fontFamily: fonts.sans,
    color: colors.mute,
  },
  errorBanner: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.red,
    borderRadius: radii.md,
    backgroundColor: colors.redSoft,
  },
  errorText: {
    fontFamily: fonts.sans,
    color: colors.red,
    fontSize: 13,
  },
  todayCount: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 22,
    letterSpacing: -0.6,
    color: colors.text,
  },
  todayList: {
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  empty: {
    padding: spacing.lg,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.lineSoft,
    backgroundColor: colors.surface,
  },
  emptyText: {
    fontFamily: fonts.sans,
    color: colors.mute,
    fontSize: 13,
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: spacing.sm + 2,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    marginTop: 4,
  },
  seeAllPressed: { opacity: 0.85 },
  seeAllText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 13,
    color: colors.navy,
    letterSpacing: 0.3,
  },
  gridWrap: {
    paddingVertical: spacing.sm,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statTile: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radii.lg,
    padding: spacing.md,
  },
  statLabel: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 10.5,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    color: colors.muteDeep,
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 4,
  },
  statValue: {
    fontFamily: fonts.mono,
    fontSize: 22,
    letterSpacing: -0.4,
    color: colors.text,
  },
  statSuffix: {
    fontFamily: fonts.sans,
    fontSize: 11,
    color: colors.mute,
  },
});
