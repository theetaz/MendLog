import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { colors, fonts, radii } from '../tokens';

interface PillProps {
  children: React.ReactNode;
  bg?: string;
  color?: string;
  style?: ViewStyle;
  testID?: string;
}

export function Pill({ children, bg = colors.lineSoft, color = colors.textDim, style, testID }: PillProps) {
  return (
    <View
      testID={testID}
      style={[styles.container, { backgroundColor: bg }, style]}
    >
      <Text style={[styles.label, { color }]}>{children}</Text>
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
