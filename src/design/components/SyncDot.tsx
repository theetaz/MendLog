import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { fonts, type ThemeColors, useColors } from '../tokens';

// Five states to match the job-level sync classifier. `pending` is kept as
// an alias for `uploading` so legacy callers (and the simpler AppBar
// derivation) don't have to change.
export type SyncState = 'synced' | 'processing' | 'uploading' | 'pending' | 'error' | 'offline';

interface SyncDotProps {
  state?: SyncState;
  hideLabel?: boolean;
}

function paint(state: SyncState, colors: ThemeColors) {
  switch (state) {
    case 'synced':
      return { color: colors.emerald, label: 'Synced' };
    case 'processing':
      return { color: colors.navy, label: 'Processing' };
    case 'uploading':
    case 'pending':
      return { color: colors.amber, label: 'Uploading' };
    case 'error':
      return { color: colors.red, label: 'Needs attention' };
    case 'offline':
      return { color: colors.mute, label: 'Offline' };
  }
}

export function SyncDot({ state = 'synced', hideLabel = false }: SyncDotProps) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { color, label } = useMemo(() => paint(state, colors), [colors, state]);
  return (
    <View style={styles.row}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      {!hideLabel && <Text style={styles.label}>{label}</Text>}
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    dot: { width: 9, height: 9, borderRadius: 999 },
    label: {
      fontSize: 11,
      fontFamily: fonts.sansMedium,
      color: colors.muteDeep,
    },
  });
