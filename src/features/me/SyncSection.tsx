import { useMemo } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { Icon, Pill, SectionLabel, SyncBadge } from '../../design/components';
import { fonts, radii, spacing, type ThemeColors, useColors } from '../../design/tokens';
import { useOptionalSync, type SyncLane, type SyncStatus } from '../../offline/syncManager';

// Pretty-print a ms timestamp as "2m ago" / "4h ago" / "just now" / "never".
function relativeTime(ms: number | null): string {
  if (!ms) return 'never';
  const diff = Date.now() - ms;
  if (diff < 30_000) return 'just now';
  if (diff < 60 * 60_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 24 * 60 * 60_000) return `${Math.floor(diff / (60 * 60_000))}h ago`;
  return `${Math.floor(diff / (24 * 60 * 60_000))}d ago`;
}

export function SyncSection() {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const sync = useOptionalSync();

  // Rendered in isolated tests where the provider isn't mounted — skip
  // silently instead of crashing.
  if (!sync) return null;

  return (
    <>
      <View style={styles.sectionHeader}>
        <SectionLabel>Sync</SectionLabel>
        <Pill
          bg={sync.online ? colors.emeraldSoft : colors.redSoft}
          color={sync.online ? colors.emerald : colors.red}
        >
          {sync.online ? 'Online' : 'Offline'}
        </Pill>
      </View>

      <View style={styles.autoSyncRow}>
        <View style={styles.autoSyncText}>
          <Text style={styles.autoSyncTitle}>Auto-sync</Text>
          <Text style={styles.autoSyncBlurb}>
            When on, MendLog syncs in the background whenever you have a
            connection. Turn off to save bandwidth and sync only from this
            screen.
          </Text>
        </View>
        <Switch
          value={sync.autoSync}
          onValueChange={sync.setAutoSync}
          trackColor={{ true: colors.navy, false: colors.line }}
          thumbColor="#fff"
        />
      </View>

      <LaneCard
        title="Job data"
        subtitle="Your jobs, photos, and voice clips"
        lane={sync.data}
        counts={sync.counts}
        buttonLabel="Sync now"
        onPress={sync.triggerData}
        disabled={!sync.online || sync.data.status === 'syncing'}
        styles={styles}
        colors={colors}
      />

      <AIWorkflowCard
        counts={sync.counts}
        online={sync.online}
        onRetry={sync.triggerAIRetry}
        styles={styles}
        colors={colors}
      />

      <LaneCard
        title="Reference data"
        subtitle="Departments & machinery"
        lane={sync.catalog}
        counts={null}
        buttonLabel="Refresh"
        onPress={sync.triggerCatalog}
        disabled={!sync.online || sync.catalog.status === 'syncing'}
        styles={styles}
        colors={colors}
      />

      <Pressable
        onPress={() => {
          if (sync.online && sync.data.status !== 'syncing') void sync.triggerFullHistory();
        }}
        disabled={!sync.online || sync.data.status === 'syncing'}
        style={({ pressed }) => [
          styles.historyBtn,
          (!sync.online || sync.data.status === 'syncing') && styles.syncBtnDisabled,
          pressed && sync.online && styles.pressed,
        ]}
      >
        <Icon
          name="cloud"
          size={14}
          color={sync.online ? colors.muteDeep : colors.mute}
          weight={2}
        />
        <View style={styles.historyBtnText}>
          <Text style={styles.historyBtnTitle}>Sync all history</Text>
          <Text style={styles.historyBtnBlurb}>
            By default we only pull the last 90 days. Tap this to download
            your full job history — use on Wi-Fi.
          </Text>
        </View>
      </Pressable>
    </>
  );
}

interface Counts {
  pendingJobs: number;
  pendingPhotos: number;
  pendingClips: number;
  pendingUploads: number;
  photosProcessing: number;
  photosError: number;
  clipsProcessing: number;
  clipsError: number;
}

function LaneCard({
  title,
  subtitle,
  lane,
  counts,
  buttonLabel,
  onPress,
  disabled,
  styles,
  colors,
}: {
  title: string;
  subtitle: string;
  lane: SyncLane;
  counts: Counts | null;
  buttonLabel: string;
  onPress(): void | Promise<void>;
  disabled: boolean;
  styles: ReturnType<typeof makeStyles>;
  colors: ThemeColors;
}) {
  const statusInfo = statusText(lane.status);
  const lastLabel = lane.lastRunAt
    ? `Last sync ${relativeTime(lane.lastRunAt)}`
    : lane.lastPulledAt
      ? `Last pulled ${relativeTime(lane.lastPulledAt)}`
      : 'Never synced';

  const pendingRows = counts
    ? [
        { label: 'Jobs not yet pushed', value: counts.pendingJobs },
        { label: 'Photos pending upload', value: counts.pendingPhotos },
        { label: 'Voice clips pending upload', value: counts.pendingClips },
        { label: 'Files in upload queue', value: counts.pendingUploads },
      ].filter((r) => r.value > 0)
    : [];

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleBlock}>
          <Text style={styles.cardTitle}>{title}</Text>
          <Text style={styles.cardSubtitle}>{subtitle}</Text>
        </View>
        <View
          style={[styles.statusPill, { backgroundColor: statusInfo.bg(colors) }]}
        >
          {lane.status === 'syncing' ? (
            <ActivityIndicator size="small" color={statusInfo.fg(colors)} />
          ) : (
            <Icon name={statusInfo.icon} size={12} color={statusInfo.fg(colors)} weight={2} />
          )}
          <Text style={[styles.statusText, { color: statusInfo.fg(colors) }]}>
            {statusInfo.label}
          </Text>
        </View>
      </View>

      <View style={styles.metaRow}>
        <Text style={styles.metaLine}>{lastLabel}</Text>
      </View>

      {pendingRows.length > 0 && (
        <View style={styles.pendingList}>
          {pendingRows.map((r) => (
            <View key={r.label} style={styles.pendingRow}>
              <Text style={styles.pendingLabel}>{r.label}</Text>
              <Text style={styles.pendingValue}>{r.value}</Text>
            </View>
          ))}
        </View>
      )}

      {lane.lastResult && !lane.lastResult.ok && lane.lastResult.error && (
        <Text style={styles.errorLine} numberOfLines={3}>
          {lane.lastResult.error}
        </Text>
      )}

      <Pressable
        onPress={() => {
          if (!disabled) void onPress();
        }}
        disabled={disabled}
        style={({ pressed }) => [
          styles.syncBtn,
          disabled && styles.syncBtnDisabled,
          pressed && !disabled && styles.pressed,
        ]}
      >
        <Icon
          name="refresh"
          size={14}
          color={disabled ? colors.mute : colors.navy}
          weight={2}
        />
        <Text style={[styles.syncBtnLabel, disabled && styles.syncBtnLabelDisabled]}>
          {lane.status === 'syncing' ? 'Syncing…' : buttonLabel}
        </Text>
      </Pressable>
    </View>
  );
}

// AI workflows run server-side (annotate-photo / transcribe-clip). The
// sync engine self-heals during each pass, but a dedicated card lets the
// user see what's in flight and force a retry when something has been
// stuck for a while.
function AIWorkflowCard({
  counts,
  online,
  onRetry,
  styles,
  colors,
}: {
  counts: Counts;
  online: boolean;
  onRetry: () => Promise<void>;
  styles: ReturnType<typeof makeStyles>;
  colors: ThemeColors;
}) {
  const rows = [
    {
      label: 'Photos processing AI',
      value: counts.photosProcessing,
      state: 'processing' as const,
    },
    {
      label: 'Photos with AI errors',
      value: counts.photosError,
      state: 'error' as const,
    },
    {
      label: 'Clips being transcribed',
      value: counts.clipsProcessing,
      state: 'processing' as const,
    },
    {
      label: 'Clips with transcript errors',
      value: counts.clipsError,
      state: 'error' as const,
    },
  ].filter((r) => r.value > 0);

  const hasWork = rows.length > 0;
  const disabled = !online || !hasWork;

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleBlock}>
          <Text style={styles.cardTitle}>AI workflows</Text>
          <Text style={styles.cardSubtitle}>
            Photo descriptions & voice transcripts
          </Text>
        </View>
        <SyncBadge
          state={
            !hasWork
              ? 'synced'
              : counts.photosError + counts.clipsError > 0
                ? 'error'
                : 'processing'
          }
        />
      </View>

      {!hasWork ? (
        <Text style={styles.metaLine}>Everything is caught up.</Text>
      ) : (
        <View style={styles.pendingList}>
          {rows.map((r) => (
            <View key={r.label} style={styles.pendingRow}>
              <View style={styles.pendingLabelRow}>
                <SyncBadge state={r.state} variant="compact" />
                <Text style={styles.pendingLabel}>{r.label}</Text>
              </View>
              <Text
                style={[
                  styles.pendingValue,
                  r.state === 'error' && { color: colors.red },
                ]}
              >
                {r.value}
              </Text>
            </View>
          ))}
        </View>
      )}

      <Pressable
        onPress={() => {
          if (!disabled) void onRetry();
        }}
        disabled={disabled}
        style={({ pressed }) => [
          styles.syncBtn,
          disabled && styles.syncBtnDisabled,
          pressed && !disabled && styles.pressed,
        ]}
      >
        <Icon
          name="sparkle"
          size={14}
          color={disabled ? colors.mute : colors.navy}
          weight={2}
        />
        <Text style={[styles.syncBtnLabel, disabled && styles.syncBtnLabelDisabled]}>
          {hasWork ? 'Retry AI processing' : 'Nothing to retry'}
        </Text>
      </Pressable>
    </View>
  );
}

function statusText(status: SyncStatus): {
  label: string;
  icon: 'check_circle' | 'cloud' | 'cloud_off' | 'warning' | 'refresh';
  bg: (c: ThemeColors) => string;
  fg: (c: ThemeColors) => string;
} {
  switch (status) {
    case 'syncing':
      return {
        label: 'Syncing',
        icon: 'refresh',
        bg: (c) => c.lineSoft,
        fg: (c) => c.navy,
      };
    case 'ok':
      return {
        label: 'Up to date',
        icon: 'check_circle',
        bg: (c) => c.emeraldSoft,
        fg: (c) => c.emerald,
      };
    case 'error':
      return {
        label: 'Error',
        icon: 'warning',
        bg: (c) => c.redSoft,
        fg: (c) => c.red,
      };
    case 'offline':
      return {
        label: 'Offline',
        icon: 'cloud_off',
        bg: (c) => c.lineSoft,
        fg: (c) => c.muteDeep,
      };
    case 'idle':
    default:
      return {
        label: 'Idle',
        icon: 'cloud',
        bg: (c) => c.lineSoft,
        fg: (c) => c.muteDeep,
      };
  }
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    autoSyncRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.md,
      padding: spacing.md,
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.surface,
    },
    autoSyncText: { flex: 1, gap: 2 },
    autoSyncTitle: {
      fontFamily: fonts.sansSemiBold,
      fontSize: 13.5,
      color: colors.text,
    },
    autoSyncBlurb: {
      fontFamily: fonts.sans,
      fontSize: 11.5,
      color: colors.mute,
      lineHeight: 16,
    },
    pendingList: {
      gap: 4,
      paddingTop: spacing.xs,
      borderTopWidth: 1,
      borderTopColor: colors.lineSoft,
    },
    pendingRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 2,
    },
    pendingLabelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      flex: 1,
      minWidth: 0,
    },
    pendingLabel: {
      fontFamily: fonts.sans,
      fontSize: 12,
      color: colors.muteDeep,
      flexShrink: 1,
    },
    pendingValue: {
      fontFamily: fonts.sansSemiBold,
      fontSize: 12.5,
      color: colors.amber,
    },
    card: {
      padding: spacing.md,
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.surface,
      gap: spacing.sm,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    cardTitleBlock: { flex: 1, minWidth: 0 },
    cardTitle: {
      fontFamily: fonts.sansSemiBold,
      fontSize: 14.5,
      color: colors.text,
      letterSpacing: -0.2,
    },
    cardSubtitle: {
      fontFamily: fonts.sans,
      fontSize: 12,
      color: colors.mute,
      marginTop: 1,
    },
    statusPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: radii.pill,
    },
    statusText: {
      fontFamily: fonts.sansSemiBold,
      fontSize: 10.5,
      letterSpacing: 0.3,
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      flexWrap: 'wrap',
    },
    metaLine: {
      fontFamily: fonts.sans,
      fontSize: 12,
      color: colors.mute,
    },
    metaSep: { fontSize: 12, color: colors.mute },
    metaAttn: { color: colors.amber, fontFamily: fonts.sansSemiBold },
    errorLine: {
      fontFamily: fonts.mono,
      fontSize: 11,
      color: colors.red,
      backgroundColor: colors.redSoft,
      paddingHorizontal: 8,
      paddingVertical: 6,
      borderRadius: radii.sm,
    },
    syncBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 9,
      borderRadius: radii.md,
      borderWidth: 1,
      borderColor: colors.line,
      backgroundColor: colors.bg,
    },
    syncBtnDisabled: { opacity: 0.55 },
    historyBtn: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
      padding: spacing.md,
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: colors.line,
      borderStyle: 'dashed',
      backgroundColor: 'transparent',
    },
    historyBtnText: { flex: 1, gap: 2 },
    historyBtnTitle: {
      fontFamily: fonts.sansSemiBold,
      fontSize: 13,
      color: colors.text,
    },
    historyBtnBlurb: {
      fontFamily: fonts.sans,
      fontSize: 11.5,
      color: colors.mute,
      lineHeight: 16,
    },
    syncBtnLabel: {
      fontFamily: fonts.sansSemiBold,
      fontSize: 12.5,
      color: colors.navy,
      letterSpacing: 0.2,
    },
    syncBtnLabelDisabled: { color: colors.mute },
    pressed: { opacity: 0.85 },
  });
