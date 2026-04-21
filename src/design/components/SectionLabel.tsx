import { useMemo } from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { fonts, type ThemeColors, useColors } from '../tokens';

interface SectionLabelProps {
  children: string;
  right?: React.ReactNode;
  style?: ViewStyle;
}

export function SectionLabel({ children, right, style }: SectionLabelProps) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={[styles.row, style]}>
      <Text style={styles.label}>{children}</Text>
      {right}
    </View>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'baseline',
      justifyContent: 'space-between',
      marginTop: 18,
      marginBottom: 8,
    },
    label: {
      fontFamily: fonts.sansSemiBold,
      fontSize: 10.5,
      letterSpacing: 1.2,
      textTransform: 'uppercase',
      color: colors.muteDeep,
    },
  });
