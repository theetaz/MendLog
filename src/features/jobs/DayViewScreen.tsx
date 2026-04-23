import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { JobCard } from '../../components/JobCard';
import { AppBar, Icon } from '../../design/components';
import { fonts, radii, spacing, type ThemeColors, useColors } from '../../design/tokens';
import type { JobsRepository } from '../../repositories/JobsRepository';
import type { Job } from '../../types/job';
import { formatIdle } from '../../utils/idle';
import { fetchPhotoThumbsForJobs, type PhotoThumb } from './photosApi';

interface DayViewScreenProps {
  repo: JobsRepository;
  dateIso: string;
  clock?: () => Date;
  onBack(): void;
  onOpenJob(id: string): void;
  onNavigateDay(dateIso: string): void;
}

const PAGE_SIZE = 20;

export function DayViewScreen({
  repo,
  dateIso,
  clock = () => new Date(),
  onBack,
  onOpenJob,
  onNavigateDay,
}: DayViewScreenProps) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [thumbs, setThumbs] = useState<Map<string, PhotoThumb[]>>(new Map());
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const offsetRef = useRef(0);
  const loadedThumbIdsRef = useRef<Set<string>>(new Set());

  // Stable callback — reads the already-loaded set from a ref so updating the
  // thumbs state doesn't invalidate loadThumbs and retrigger useFocusEffect.
  const loadThumbs = useCallback(async (jobRows: Job[]) => {
    const ids = jobRows
      .map((j) => j.id)
      .filter((id) => !loadedThumbIdsRef.current.has(id));
    if (ids.length === 0) return;
    ids.forEach((id) => loadedThumbIdsRef.current.add(id));
    try {
      const map = await fetchPhotoThumbsForJobs(ids, 4);
      setThumbs((prev) => {
        const next = new Map(prev);
        for (const [k, v] of map) next.set(k, v);
        return next;
      });
    } catch (e) {
      console.warn('load thumbs:', e);
    }
  }, []);

  const reset = useCallback(async () => {
    setLoading(true);
    offsetRef.current = 0;
    setThumbs(new Map());
    loadedThumbIdsRef.current = new Set();
    try {
      const page = await repo.listJobsForDate(dateIso, { limit: PAGE_SIZE, offset: 0 });
      setJobs(page.jobs);
      setHasMore(page.hasMore);
      offsetRef.current = page.jobs.length;
      setError(null);
      loadThumbs(page.jobs);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [repo, dateIso, loadThumbs]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const page = await repo.listJobsForDate(dateIso, {
        limit: PAGE_SIZE,
        offset: offsetRef.current,
      });
      setJobs((prev) => prev.concat(page.jobs));
      setHasMore(page.hasMore);
      offsetRef.current += page.jobs.length;
      loadThumbs(page.jobs);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load more');
    } finally {
      setLoadingMore(false);
    }
  }, [repo, dateIso, loadingMore, hasMore, loadThumbs]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    offsetRef.current = 0;
    setThumbs(new Map());
    loadedThumbIdsRef.current = new Set();
    try {
      const page = await repo.listJobsForDate(dateIso, { limit: PAGE_SIZE, offset: 0 });
      setJobs(page.jobs);
      setHasMore(page.hasMore);
      offsetRef.current = page.jobs.length;
      setError(null);
      loadThumbs(page.jobs);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to refresh');
    } finally {
      setRefreshing(false);
    }
  }, [repo, dateIso, loadThumbs]);

  useFocusEffect(
    useCallback(() => {
      reset();
    }, [reset]),
  );

  const relativeLabel = useMemo(() => relativeDayLabel(dateIso, clock()), [dateIso, clock]);
  const { prev, next } = useMemo(() => siblingDays(dateIso), [dateIso]);

  const header = (
    <DayHeader
      dateIso={dateIso}
      relativeLabel={relativeLabel}
      prev={prev}
      next={next}
      onNavigateDay={onNavigateDay}
      summary={summarize(jobs)}
      styles={styles}
    />
  );

  return (
    <View style={styles.container}>
      <AppBar
        title={formatFullDate(dateIso)}
        subtitle={relativeLabel ?? undefined}
        left={
          <Pressable onPress={onBack} hitSlop={10}>
            <Icon name="x" size={22} color={colors.text} weight={2} />
          </Pressable>
        }
      />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.navy} />
        </View>
      ) : error && jobs.length === 0 ? (
        <View style={styles.center}>
          <Icon name="warning" size={28} color={colors.red} weight={2} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={jobs}
          keyExtractor={(j) => String(j.id)}
          ListHeaderComponent={header}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: insets.bottom + spacing.xxl },
          ]}
          ListEmptyComponent={
            <View style={styles.emptyDay}>
              <Text style={styles.emptyTitle}>Nothing logged on this day.</Text>
              <Text style={styles.emptyHint}>Use the stepper above to browse other days.</Text>
            </View>
          }
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.navy} />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          renderItem={({ item, index }) => (
            <View style={styles.timelineRow}>
              <View style={styles.timelineRail}>
                <Text style={styles.timelineTime}>{item.time}</Text>
                <View style={styles.timelineDot} />
                {index < jobs.length - 1 && <View style={styles.timelineLine} />}
              </View>
              <View style={styles.timelineCard}>
                <JobCard
                  job={item}
                  variant="compact"
                  photos={thumbs.get(item.id)}
                  onPress={() => onOpenJob(item.id)}
                  testID={`day-card-${item.id}`}
                />
              </View>
            </View>
          )}
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.footerLoading}>
                <ActivityIndicator size="small" color={colors.navy} />
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
}

interface DayHeaderProps {
  dateIso: string;
  relativeLabel: string | null;
  prev: string;
  next: string;
  onNavigateDay(iso: string): void;
  summary: DaySummary;
}

function DayHeader({
  prev,
  next,
  onNavigateDay,
  summary,
  styles,
}: DayHeaderProps & { styles: ReturnType<typeof makeStyles> }) {
  const colors = useColors();
  return (
    <View style={styles.headerBlock}>
      <View style={styles.stepperRow}>
        <Pressable
          onPress={() => onNavigateDay(prev)}
          style={({ pressed }) => [styles.stepBtn, pressed && styles.pressed]}
        >
          <Icon name="chevron-left" size={16} color={colors.navy} weight={2} />
          <Text style={styles.stepLabel}>Prev day</Text>
        </Pressable>
        <Pressable
          onPress={() => onNavigateDay(next)}
          style={({ pressed }) => [styles.stepBtn, pressed && styles.pressed]}
        >
          <Text style={styles.stepLabel}>Next day</Text>
          <Icon name="chevron-right" size={16} color={colors.navy} weight={2} />
        </Pressable>
      </View>

      <View style={styles.statsRow}>
        <StatTile label="Jobs" value={String(summary.count)} styles={styles} />
        <StatTile label="Total idle" value={summary.idleLabel} styles={styles} />
        <StatTile label="Machines" value={String(summary.machines)} styles={styles} />
      </View>
    </View>
  );
}

function StatTile({ label, value, styles }: { label: string; value: string; styles: ReturnType<typeof makeStyles> }) {
  return (
    <View style={styles.statTile}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

interface DaySummary {
  count: number;
  idleLabel: string;
  machines: number;
}

function summarize(jobs: Job[]): DaySummary {
  const totalIdle = jobs.reduce((sum, j) => sum + (j.idleMinutes ?? 0), 0);
  return {
    count: jobs.length,
    idleLabel: jobs.length ? formatIdle(totalIdle) : '—',
    machines: new Set(jobs.map((j) => j.machine)).size,
  };
}

function relativeDayLabel(dateIso: string, now: Date): string | null {
  const today = isoLocal(now);
  if (dateIso === today) return 'Today';
  const yesterday = isoLocal(shiftDays(now, -1));
  if (dateIso === yesterday) return 'Yesterday';
  const tomorrow = isoLocal(shiftDays(now, 1));
  if (dateIso === tomorrow) return 'Tomorrow';
  return null;
}

function siblingDays(dateIso: string): { prev: string; next: string } {
  const [y, m, d] = dateIso.split('-').map(Number);
  const base = new Date(y, (m ?? 1) - 1, d ?? 1);
  return {
    prev: isoLocal(shiftDays(base, -1)),
    next: isoLocal(shiftDays(base, 1)),
  };
}

function isoLocal(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function shiftDays(d: Date, delta: number): Date {
  const next = new Date(d);
  next.setDate(d.getDate() + delta);
  return next;
}

function formatFullDate(dateIso: string): string {
  const [y, m, d] = dateIso.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1).toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  list: {
    paddingHorizontal: spacing.xl,
  },
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
  pressed: { opacity: 0.85 },

  headerBlock: { paddingBottom: spacing.md, gap: spacing.md },
  stepperRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: spacing.sm,
  },
  stepBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  stepLabel: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 12,
    color: colors.navy,
    letterSpacing: 0.3,
  },

  statsRow: { flexDirection: 'row', gap: spacing.sm },
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
  statValue: {
    fontFamily: fonts.mono,
    fontSize: 20,
    letterSpacing: -0.3,
    color: colors.text,
    marginTop: 4,
  },

  emptyDay: {
    padding: spacing.lg,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.lineSoft,
    backgroundColor: colors.surface,
    gap: 4,
    marginTop: spacing.md,
  },
  emptyTitle: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 14,
    color: colors.text,
  },
  emptyHint: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.mute,
  },

  timelineRow: { flexDirection: 'row', gap: spacing.sm, paddingVertical: 4 },
  timelineRail: { alignItems: 'center', width: 56, paddingTop: 2 },
  timelineTime: {
    fontFamily: fonts.mono,
    fontSize: 11,
    color: colors.muteDeep,
    marginBottom: 4,
  },
  timelineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.navy,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    minHeight: 32,
    backgroundColor: colors.line,
    marginTop: 4,
  },
  timelineCard: { flex: 1 },

  footerLoading: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
});
