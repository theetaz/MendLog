import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { fonts, type ThemeColors, useColors } from '../tokens';

export type SyncState = 'synced' | 'pending' | 'offline';

interface SyncDotProps {
  state?: SyncState;
}

export function SyncDot({ state = 'synced' }: SyncDotProps) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { color, label } = useMemo(() => {
    switch (state) {
      case 'synced':
        return { color: colors.emerald, label: 'Synced' };
      case 'pending':
        return { color: colors.amber, label: 'Pending' };
      case 'offline':
        return { color: colors.red, label: 'Offline' };
    }
  }, [colors, state]);
  return (
    <View style={styles.row}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={styles.label}>{label}</Text>
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
