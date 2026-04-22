import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useOptionalSync } from '../../offline/syncManager';
import { fonts, type ThemeColors, useColors } from '../tokens';
import { SyncDot, type SyncState } from './SyncDot';

interface AppBarProps {
  title: string;
  subtitle?: string;
  left?: React.ReactNode;
  right?: React.ReactNode;
  sync?: SyncState; // explicit override wins over auto-wired state
  disableTopInset?: boolean;
}

// Derive the three-state dot color from the full sync context. Offline wins
// over everything; otherwise "pending" when there's anything dirty or
// uploading, else "synced".
function derivedSyncState(ctx: ReturnType<typeof useOptionalSync>): SyncState {
  if (!ctx) return 'synced';
  if (!ctx.online) return 'offline';
  const { pendingJobs, pendingPhotos, pendingClips, pendingUploads } = ctx.counts;
  if (pendingJobs + pendingPhotos + pendingClips + pendingUploads > 0) return 'pending';
  return 'synced';
}

export function AppBar({
  title,
  subtitle,
  left,
  right,
  sync,
  disableTopInset = false,
}: AppBarProps) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const syncCtx = useOptionalSync();
  const topPad = disableTopInset ? 10 : insets.top + 10;
  const resolvedSync: SyncState = sync ?? derivedSyncState(syncCtx);

  const defaultRight = syncCtx ? (
    <Pressable
      onPress={() => router.push('/(tabs)/me' as never)}
      hitSlop={6}
      accessibilityLabel="Open sync status"
    >
      <SyncDot state={resolvedSync} />
    </Pressable>
  ) : (
    <SyncDot state={resolvedSync} />
  );

  return (
    <View style={[styles.bar, { paddingTop: topPad }]}>
      {left}
      <View style={styles.stack}>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
      </View>
      {right !== undefined ? right : defaultRight}
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    bar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingHorizontal: 18,
      paddingBottom: 10,
      backgroundColor: colors.bg,
    },
    stack: { flex: 1, minWidth: 0 },
    subtitle: {
      fontSize: 11,
      fontFamily: fonts.sansMedium,
      color: colors.mute,
      letterSpacing: 0.05,
      marginBottom: 1,
    },
    title: {
      fontSize: 17,
      fontFamily: fonts.sansSemiBold,
      color: colors.text,
      letterSpacing: -0.35,
      lineHeight: 20,
    },
  });
