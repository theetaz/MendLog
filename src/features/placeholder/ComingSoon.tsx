import { StyleSheet, Text, View } from 'react-native';
import { AppBar } from '../../design/components/AppBar';
import { colors, fonts, spacing } from '../../design/tokens';

interface ComingSoonProps {
  title: string;
  blurb: string;
}

export function ComingSoon({ title, blurb }: ComingSoonProps) {
  return (
    <View style={styles.container}>
      <AppBar title={title} />
      <View style={styles.body}>
        <Text style={styles.label}>Coming soon</Text>
        <Text style={styles.blurb}>{blurb}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  label: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 12,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: colors.muteDeep,
    marginBottom: spacing.sm,
  },
  blurb: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.mute,
    textAlign: 'center',
    lineHeight: 20,
  },
});
