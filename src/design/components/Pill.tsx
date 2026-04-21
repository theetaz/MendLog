import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { fonts, radii, useColors } from '../tokens';

interface PillProps {
  children: React.ReactNode;
  bg?: string;
  color?: string;
  style?: ViewStyle;
  testID?: string;
}

export function Pill({ children, bg, color, style, testID }: PillProps) {
  const colors = useColors();
  const resolvedBg = bg ?? colors.lineSoft;
  const resolvedColor = color ?? colors.textDim;
  return (
    <View
      testID={testID}
      style={[styles.container, { backgroundColor: resolvedBg }, style]}
    >
      <Text style={[styles.label, { color: resolvedColor }]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: radii.pill,
    gap: 4,
  },
  label: {
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    letterSpacing: 0.1,
  },
});
