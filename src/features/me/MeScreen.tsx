import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppBar, Btn, Icon, SectionLabel } from '../../design/components';
import { colors, fonts, radii, spacing } from '../../design/tokens';
import type { JobsRepository } from '../../repositories/JobsRepository';
import { formatIdle } from '../../utils/idle';
import { useProfileData } from './useProfileData';

interface MeScreenProps {
  email: string | null;
  displayName?: string;
  memberSince?: string;
  repo?: JobsRepository | null;
  onSignOut(): Promise<void> | void;
  onOpenJobs?(): void;
  confirmSignOut?: (onConfirm: () => void) => void;
}

function avatarInitial(name: string | null | undefined, email: string | null) {
  const src = (name ?? email ?? '?').trim();
  return src.charAt(0).toUpperCase() || '?';
}

function formatMemberSince(iso?: string): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

const defaultConfirm = (onConfirm: () => void) => {
  Alert.alert('Sign out?', "You'll need your email and password to come back.", [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Sign out', style: 'destructive', onPress: onConfirm },
  ]);
};

export function MeScreen({
  email,
  displayName,
  memberSince,
  repo,
  onSignOut,
  onOpenJobs,
  confirmSignOut = defaultConfirm,
}: MeScreenProps) {
  const insets = useSafeAreaInsets();
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const data = useProfileData(repo ?? null);

  useFocusEffect(
    useCallback(() => {
      if (repo) data.reload();
    }, [data.reload, repo]),
  );

  const handleSignOut = useCallback(() => {
    confirmSignOut(async () => {
      if (busy) return;
      setBusy(true);
      try {
        await onSignOut();
      } finally {
        setBusy(false);
      }
    });
  }, [busy, confirmSignOut, onSignOut]);

  const handleRefresh = useCallback(async () => {
    if (!repo) return;
    setRefreshing(true);
    data.reload();
    setTimeout(() => setRefreshing(false), 350);
  }, [data, repo]);

  const memberSinceLabel = formatMemberSince(memberSince);
  const hasJobs = data.jobs.length > 0;

  return (
    <View style={styles.container}>
      <AppBar title="Me" />
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + 120 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          repo ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.navy}
            />
          ) : undefined
        }
      >
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{avatarInitial(displayName, email)}</Text>
          </View>
          <View style={styles.profileText}>
            <Text style={styles.name} numberOfLines={1}>
              {displayName ?? 'Technician'}
            </Text>
            <Text style={styles.email} numberOfLines={1}>
              {email ?? 'No email on this session'}
            </Text>
            {memberSinceLabel && (
              <Text style={styles.memberSince}>Member since {memberSinceLabel}</Text>
            )}
          </View>
        </View>

        {repo && (
          <>
            <SectionLabel>
              {data.loading
                ? 'Activity · loading…'
                : `Activity · ${data.stats.totalJobs} ${
                    data.stats.totalJobs === 1 ? 'job' : 'jobs'
                  } in the last year`}
            </SectionLabel>

            {data.loading ? (
              <View style={styles.loadingCard}>
                <ActivityIndicator size="small" color={colors.navy} />
              </View>
            ) : data.error ? (
              <View style={styles.errorCard}>
                <Icon name="warning" size={14} color={colors.red} weight={2} />
                <Text style={styles.errorText}>{data.error.message}</Text>
              </View>
            ) : (
              <>
                {hasJobs && (
                  <View style={styles.streakRow}>
                    <Icon name="flash" size={14} color={colors.amber} weight={2} />
                    <Text style={styles.streakText}>
                      Longest streak · {data.streaks.longestStreak}{' '}
                      {data.streaks.longestStreak === 1 ? 'day' : 'days'}
                      {'  ·  '}
                      Current · {data.streaks.currentStreak}{' '}
                      {data.streaks.currentStreak === 1 ? 'day' : 'days'}
                    </Text>
                  </View>
                )}

                <SectionLabel>Stats</SectionLabel>
                <View style={styles.statGrid}>
                  <StatTile
                    label="Total jobs"
                    value={String(data.stats.totalJobs)}
                  />
                  <StatTile
                    label="Avg idle"
                    value={
                      data.stats.avgIdleMinutes > 0
                        ? formatIdle(data.stats.avgIdleMinutes)
                        : '—'
                    }
                  />
                  <StatTile
                    label="Top machine"
                    value={data.stats.topMachine?.name ?? '—'}
                    sub={
                      data.stats.topMachine
                        ? `${data.stats.topMachine.count} ${
                            data.stats.topMachine.count === 1 ? 'job' : 'jobs'
                          }`
                        : undefined
                    }
                  />
                  <StatTile
                    label="Top department"
                    value={data.stats.topDept?.name ?? '—'}
                    sub={
                      data.stats.topDept
                        ? `${data.stats.topDept.count} ${
                            data.stats.topDept.count === 1 ? 'job' : 'jobs'
                          }`
                        : undefined
                    }
                  />
                </View>

                {onOpenJobs && (
                  <Pressable
                    onPress={onOpenJobs}
                    style={({ pressed }) => [
                      styles.openCalendarBtn,
                      pressed && styles.pressed,
                    ]}
                    testID="me-open-jobs"
                  >
                    <Icon name="calendar" size={16} color={colors.navy} weight={2} />
                    <Text style={styles.openCalendarText}>Open jobs calendar</Text>
                  </Pressable>
                )}
              </>
            )}
          </>
        )}

        <SectionLabel>Account</SectionLabel>
        <View style={styles.actions}>
          <Btn
            kind="ghost"
            size="lg"
            block
            disabled={busy}
            onPress={handleSignOut}
            testID="me-sign-out"
          >
            {busy ? 'Signing out…' : 'Sign out'}
          </Btn>
          <View style={styles.metaRow}>
            <Icon name="info" size={14} color={colors.mute} weight={1.8} />
            <Text style={styles.metaText}>Version 1.0.0 · MendLog</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function StatTile({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <View style={styles.statTile}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue} numberOfLines={1}>
        {value}
      </Text>
      {sub && <Text style={styles.statSub}>{sub}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: {
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    padding: spacing.lg,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    marginBottom: spacing.sm,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.navy,
  },
  avatarText: {
    fontFamily: fonts.sansBold,
    fontSize: 22,
    letterSpacing: -0.4,
    color: '#fff',
  },
  profileText: { flex: 1, minWidth: 0, gap: 2 },
  name: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 18,
    letterSpacing: -0.4,
    color: colors.text,
  },
  email: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.mute,
  },
  memberSince: {
    fontFamily: fonts.sans,
    fontSize: 11.5,
    color: colors.mute,
    marginTop: 2,
  },

  loadingCard: {
    padding: spacing.lg,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.lineSoft,
    backgroundColor: colors.surface,
    alignItems: 'center',
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.red,
    backgroundColor: colors.redSoft,
  },
  errorText: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.red,
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  streakText: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.muteDeep,
  },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  statTile: {
    width: '48.5%',
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    gap: 4,
  },
  statLabel: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 10.5,
    color: colors.muteDeep,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  statValue: {
    fontFamily: fonts.sansBold,
    fontSize: 18,
    letterSpacing: -0.4,
    color: colors.text,
  },
  statSub: {
    fontFamily: fonts.sans,
    fontSize: 11.5,
    color: colors.mute,
  },
  openCalendarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    marginTop: spacing.xs,
  },
  pressed: { opacity: 0.85 },
  openCalendarText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 13,
    color: colors.navy,
    letterSpacing: 0.3,
  },

  actions: { gap: spacing.md },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingTop: spacing.sm,
  },
  metaText: {
    fontFamily: fonts.sans,
    fontSize: 11.5,
    color: colors.mute,
  },
});
