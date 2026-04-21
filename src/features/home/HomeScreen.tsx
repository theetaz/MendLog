import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppBar } from '../../design/components/AppBar';
import { SectionLabel } from '../../design/components/SectionLabel';
import { colors, fonts, radii, spacing } from '../../design/tokens';
import { ContributionGrid } from '../../components/ContributionGrid';
import { JobCard } from '../../components/JobCard';
import type { JobsRepository } from '../../repositories/JobsRepository';
import { useHomeData } from './useHomeData';

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
  clock,
  onOpenJob,
  onOpenDay,
}: HomeScreenProps) {
  const data = useHomeData(repo, clock);
  const insets = useSafeAreaInsets();

  if (data.loading) {
    return (
      <View testID="home-loading" style={styles.loading}>
        <Text style={styles.loadingText}>Loading…</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 120 }]}
      showsVerticalScrollIndicator={false}
    >
      <AppBar title={`Hello, ${userName}`} />

      {data.error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{data.error.message}</Text>
        </View>
      )}

      <SectionLabel>Today</SectionLabel>
      <View style={styles.todayHeader}>
        <Text style={styles.todayCount}>{data.today.length} jobs today</Text>
      </View>
      <View style={styles.todayList}>
        {data.today.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No jobs yet today — tap + to start.</Text>
          </View>
        ) : (
          data.today.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              variant="horizontal"
              testID={`home-today-card-${job.id}`}
              onPress={() => onOpenJob?.(job.id)}
            />
          ))
        )}
      </View>

      <SectionLabel>Activity · last 12 weeks</SectionLabel>
      <View style={styles.gridWrap}>
        <ContributionGrid
          data={data.activity}
          variant="compact"
          onCellTap={(day) => onOpenDay?.(day.date)}
        />
      </View>

      <SectionLabel>This week</SectionLabel>
      <View style={styles.statsRow}>
        <Stat label="Jobs" value={String(data.thisWeekCount)} />
        <Stat label="Avg idle" value={data.avgIdle} />
        <Stat label="Streak" value={String(data.streak)} suffix="days" />
      </View>
    </ScrollView>
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
  content: {},
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
    marginHorizontal: spacing.xl,
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
  todayHeader: { paddingHorizontal: spacing.xl },
  todayCount: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 22,
    letterSpacing: -0.6,
    color: colors.text,
  },
  todayList: {
    paddingHorizontal: spacing.xl,
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
  gridWrap: {
    paddingHorizontal: spacing.xl,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
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
