import { StyleSheet, View, type ViewStyle } from 'react-native';

interface PhotoBoxProps {
  seed: number;
  size?: number;
  style?: ViewStyle;
  testID?: string;
}

interface Variant {
  bg: string;
  accent: string;
  accentLeft: string;
  accentTop: string;
}

const VARIANTS: Variant[] = [
  { bg: '#2d3748', accent: '#e2a900', accentLeft: '55%', accentTop: '50%' },
  { bg: '#374151', accent: '#c2410c', accentLeft: '40%', accentTop: '60%' },
  { bg: '#4b5563', accent: '#1e3a5f', accentLeft: '60%', accentTop: '45%' },
  { bg: '#292524', accent: '#a16207', accentLeft: '50%', accentTop: '55%' },
  { bg: '#27272a', accent: '#166534', accentLeft: '45%', accentTop: '50%' },
];

export function PhotoBox({ seed, size, style, testID }: PhotoBoxProps) {
  const variant = VARIANTS[((seed % VARIANTS.length) + VARIANTS.length) % VARIANTS.length];
  const dimStyle: ViewStyle = size != null ? { width: size, height: size } : { width: '100%', height: '100%' };
  return (
    <View
      testID={testID}
      style={[styles.box, { backgroundColor: variant.bg }, dimStyle, style]}
    >
      <View
        style={[
          styles.accent,
          {
            backgroundColor: variant.accent,
            left: variant.accentLeft as unknown as number,
            top: variant.accentTop as unknown as number,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  accent: {
    position: 'absolute',
    width: '38%',
    height: '28%',
    marginLeft: '-19%',
    marginTop: '-14%',
    borderRadius: 4,
    transform: [{ rotate: '-8deg' }],
  },
});
