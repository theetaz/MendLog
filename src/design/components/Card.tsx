import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import { colors, radii } from '../tokens';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  padded?: boolean;
  style?: ViewStyle | ViewStyle[];
  testID?: string;
}

export function Card({ children, onPress, padded = true, style, testID }: CardProps) {
  const composed = [styles.base, padded && styles.padded, style];
  if (onPress) {
    return (
      <Pressable testID={testID} onPress={onPress} style={composed}>
        {children}
      </Pressable>
    );
  }
  return (
    <View testID={testID} style={composed}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radii.lg,
  },
  padded: {
    padding: 14,
  },
});
