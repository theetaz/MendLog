import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { JobCard } from '../../components/JobCard';
import { AppBar, Icon, SectionLabel } from '../../design/components';
import { colors, fonts, radii, spacing } from '../../design/tokens';
import type { JobsRepository } from '../../repositories/JobsRepository';
import type { Job } from '../../types/job';
import { CalendarView, countsByDate } from './CalendarView';
import { JobsListBody } from './JobsListScreen';

const VIEW_KEY = '@mendlog/jobs-view-v1';

type JobsView = 'list' | 'calendar';

interface JobsTabScreenProps {
  repo: JobsRepository;
  onOpenJob(id: number): void;
  onOpenDay(dateIso: string): void;
}

export function JobsTabScreen({ repo, onOpenJob, onOpenDay }: JobsTabScreenProps) {
  const insets = useSafeAreaInsets();
  const [view, setView] = useState<JobsView>('list');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const todayIso = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);
  const [selectedDate, setSelectedDate] = useState<string | null>(todayIso);

  // Reset selection back to today whenever the user switches back to Calendar.
  useEffect(() => {
    if (view === 'calendar') setSelectedDate(todayIso);
  }, [view, todayIso]);

  useEffect(() => {
    AsyncStorage.getItem(VIEW_KEY)
      .then((v) => {
        if (v === 'calendar' || v === 'list') setView(v);
      })
      .catch(() => {});
  }, []);

  const switchView = useCallback((next: JobsView) => {
    setView(next);
    AsyncStorage.setItem(VIEW_KEY, next).catch(() => {});
  }, []);

  const load = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);
        const rows = await repo.listJobs();
        setJobs(rows);
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

  const subtitle = useMemo(
    () => (jobs.length > 0 ? `${jobs.length} total` : undefined),
    [jobs.length],
  );

  const counts = useMemo(() => countsByDate(jobs), [jobs]);

  return (
    <View style={styles.container}>
      <AppBar title="Jobs" subtitle={subtitle} />

      <View style={styles.toggleWrap}>
        <Segment label="List" active={view === 'list'} onPress={() => switchView('list')} icon="list" />
        <Segment
          label="Calendar"
          active={view === 'calendar'}
          onPress={() => switchView('calendar')}
          icon="calendar"
        />
      </View>

      {loading && jobs.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.navy} />
        </View>
      ) : error && jobs.length === 0 ? (
        <View style={styles.center}>
          <Icon name="warning" size={28} color={colors.red} weight={2} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : view === 'list' ? (
        <JobsListBody
          jobs={jobs}
          refreshing={refreshing}
          onRefresh={() => load(true)}
          onOpenJob={onOpenJob}
        />
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.calendarScroll,
            { paddingBottom: insets.bottom + 120 },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => load(true)}
              tintColor={colors.navy}
            />
          }
        >
          <CalendarView
            counts={counts}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
          />
          <SelectedDayList
            selectedDate={selectedDate}
            jobs={jobs}
            onOpenJob={onOpenJob}
            onOpenDay={onOpenDay}
          />
        </ScrollView>
      )}
    </View>
  );
}

interface SelectedDayListProps {
  selectedDate: string | null;
  jobs: Job[];
  onOpenJob(id: number): void;
  onOpenDay(dateIso: string): void;
}

function SelectedDayList({ selectedDate, jobs, onOpenJob, onOpenDay }: SelectedDayListProps) {
  if (!selectedDate) {
    return (
      <View style={styles.pickDayHint}>
        <Icon name="calendar" size={18} color={colors.mute} weight={1.8} />
        <Text style={styles.pickDayText}>Tap a day to see its jobs.</Text>
      </View>
    );
  }

  const dayJobs = jobs
    .filter((j) => j.date === selectedDate)
    .sort((a, b) => a.time.localeCompare(b.time));

  const [y, m, d] = selectedDate.split('-').map(Number);
  const label = new Date(y, (m ?? 1) - 1, d ?? 1).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <View style={styles.daySection}>
      <View style={styles.daySectionHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.daySectionTitle}>{label}</Text>
          <Text style={styles.daySectionSub}>
            {dayJobs.length === 0
              ? 'No jobs logged.'
              : `${dayJobs.length} ${dayJobs.length === 1 ? 'job' : 'jobs'}`}
          </Text>
        </View>
        {dayJobs.length > 0 && (
          <Pressable
            onPress={() => onOpenDay(selectedDate)}
            hitSlop={8}
            style={({ pressed }) => [styles.openDayBtn, pressed && styles.pressed]}
          >
            <Text style={styles.openDayBtnText}>Open day</Text>
          </Pressable>
        )}
      </View>

      {dayJobs.length === 0 ? (
        <View style={styles.dayEmpty}>
          <Text style={styles.dayEmptyText}>Nothing logged on this day.</Text>
        </View>
      ) : (
        <View style={styles.dayJobsList}>
          {dayJobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              variant="horizontal"
              onPress={() => onOpenJob(job.id)}
              testID={`calendar-day-card-${job.id}`}
            />
          ))}
        </View>
      )}
    </View>
  );
}

function Segment({
  label,
  active,
  onPress,
  icon,
}: {
  label: string;
  active: boolean;
  onPress(): void;
  icon: 'list' | 'calendar';
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.segment,
        active && styles.segmentActive,
        pressed && styles.pressed,
      ]}
    >
      <Icon name={icon} size={14} color={active ? '#fff' : colors.navy} weight={2} />
      <Text style={[styles.segmentLabel, active && styles.segmentLabelActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  toggleWrap: {
    flexDirection: 'row',
    alignSelf: 'center',
    gap: 0,
    marginHorizontal: spacing.xl,
    marginBottom: spacing.sm,
    padding: 3,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  segment: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderRadius: radii.pill,
  },
  segmentActive: { backgroundColor: colors.navy },
  pressed: { opacity: 0.88 },
  segmentLabel: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 12,
    color: colors.navy,
    letterSpacing: 0.3,
  },
  segmentLabelActive: { color: '#fff' },
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
  calendarScroll: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    gap: spacing.lg,
  },
  pickDayHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.lineSoft,
    backgroundColor: colors.surface,
  },
  pickDayText: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.mute,
  },
  daySection: { gap: spacing.sm },
  daySectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  daySectionTitle: {
    fontFamily: fonts.sansBold,
    fontSize: 16,
    color: colors.text,
    letterSpacing: -0.2,
  },
  daySectionSub: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.mute,
    marginTop: 2,
  },
  openDayBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  openDayBtnText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 12,
    color: colors.navy,
    letterSpacing: 0.3,
  },
  dayEmpty: {
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.lineSoft,
    backgroundColor: colors.surface,
  },
  dayEmptyText: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.mute,
  },
  dayJobsList: { gap: spacing.sm },
});
