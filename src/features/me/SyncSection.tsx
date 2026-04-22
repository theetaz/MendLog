import { useMemo } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon, Pill, SectionLabel } from '../../design/components';
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

      <LaneCard
        title="Job data"
        subtitle="Your jobs, photos, and voice clips"
        lane={sync.data}
        pendingSummary={pendingSummary(sync.counts)}
        buttonLabel="Sync now"
        onPress={sync.triggerData}
        disabled={!sync.online || sync.data.status === 'syncing'}
        styles={styles}
        colors={colors}
      />

      <LaneCard
        title="Reference data"
        subtitle="Departments & machinery"
        lane={sync.catalog}
        pendingSummary={null}
        buttonLabel="Refresh"
        onPress={sync.triggerCatalog}
        disabled={!sync.online || sync.catalog.status === 'syncing'}
        styles={styles}
        colors={colors}
      />
    </>
  );
}

function pendingSummary(counts: {
  pendingJobs: number;
  pendingPhotos: number;
  pendingClips: number;
  pendingUploads: number;
}): string | null {
  const parts: string[] = [];
  if (counts.pendingJobs) parts.push(`${counts.pendingJobs} job${counts.pendingJobs === 1 ? '' : 's'}`);
  if (counts.pendingUploads)
    parts.push(`${counts.pendingUploads} upload${counts.pendingUploads === 1 ? '' : 's'}`);
  if (counts.pendingPhotos + counts.pendingClips && !counts.pendingUploads) {
    const n = counts.pendingPhotos + counts.pendingClips;
    parts.push(`${n} row${n === 1 ? '' : 's'}`);
  }
  if (parts.length === 0) return null;
  return `${parts.join(' · ')} pending`;
}

function LaneCard({
  title,
  subtitle,
  lane,
  pendingSummary,
  buttonLabel,
  onPress,
  disabled,
  styles,
  colors,
}: {
  title: string;
  subtitle: string;
  lane: SyncLane;
  pendingSummary: string | null;
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
        {pendingSummary && (
          <>
            <Text style={styles.metaSep}>·</Text>
            <Text style={[styles.metaLine, styles.metaAttn]}>{pendingSummary}</Text>
          </>
        )}
      </View>

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
    syncBtnLabel: {
      fontFamily: fonts.sansSemiBold,
      fontSize: 12.5,
      color: colors.navy,
      letterSpacing: 0.2,
    },
    syncBtnLabelDisabled: { color: colors.mute },
    pressed: { opacity: 0.85 },
  });
