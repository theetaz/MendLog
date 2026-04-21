import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts } from '../tokens';
import { SyncDot, type SyncState } from './SyncDot';

interface AppBarProps {
  title: string;
  subtitle?: string;
  left?: React.ReactNode;
  right?: React.ReactNode;
  sync?: SyncState;
  /** Disable automatic top safe-area padding (e.g. inside a modal with its own header). */
  disableTopInset?: boolean;
}

export function AppBar({
  title,
  subtitle,
  left,
  right,
  sync = 'synced',
  disableTopInset = false,
}: AppBarProps) {
  const insets = useSafeAreaInsets();
  const topPad = disableTopInset ? 10 : insets.top + 10;
  return (
    <View style={[styles.bar, { paddingTop: topPad }]}>
      {left}
      <View style={styles.stack}>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
      </View>
      {right !== undefined ? right : <SyncDot state={sync} />}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 18,
    paddingBottom: 10,
    backgroundColor: colors.bg,
  },
  stack: {
    flex: 1,
    minWidth: 0,
  },
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
