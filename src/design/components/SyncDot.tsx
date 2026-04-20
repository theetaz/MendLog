import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../tokens';

export type SyncState = 'synced' | 'pending' | 'offline';

interface SyncDotProps {
  state?: SyncState;
}

const STATES: Record<SyncState, { color: string; label: string }> = {
  synced: { color: colors.emerald, label: 'Synced' },
  pending: { color: colors.amber, label: 'Pending' },
  offline: { color: colors.red, label: 'Offline' },
};

export function SyncDot({ state = 'synced' }: SyncDotProps) {
  const { color, label } = STATES[state];
  return (
    <View style={styles.row}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 999,
  },
  label: {
    fontSize: 11,
    fontFamily: fonts.sansMedium,
    color: colors.muteDeep,
  },
});
