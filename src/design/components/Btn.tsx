import { Pressable, StyleSheet, Text, type ViewStyle } from 'react-native';
import { colors, fonts } from '../tokens';

export type BtnKind = 'primary' | 'navy' | 'ghost' | 'danger' | 'soft';
export type BtnSize = 'sm' | 'md' | 'lg';

interface BtnProps {
  children: string;
  onPress?: () => void;
  kind?: BtnKind;
  size?: BtnSize;
  block?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  testID?: string;
}

const SIZES: Record<BtnSize, { paddingVertical: number; fontSize: number; borderRadius: number }> = {
  sm: { paddingVertical: 8, fontSize: 12, borderRadius: 9 },
  md: { paddingVertical: 12, fontSize: 13.5, borderRadius: 11 },
  lg: { paddingVertical: 15, fontSize: 14.5, borderRadius: 13 },
};

const KINDS: Record<BtnKind, { bg: string; fg: string; border: string }> = {
  primary: { bg: colors.yellow, fg: colors.ink, border: 'transparent' },
  navy: { bg: colors.navy, fg: '#fff', border: 'transparent' },
  ghost: { bg: 'transparent', fg: colors.text, border: colors.line },
  danger: { bg: colors.red, fg: '#fff', border: 'transparent' },
  soft: { bg: '#F1EEE6', fg: colors.text, border: 'transparent' },
};

export function Btn({
  children,
  onPress,
  kind = 'primary',
  size = 'md',
  block = false,
  disabled = false,
  style,
  testID,
}: BtnProps) {
  const sz = SIZES[size];
  const k = KINDS[kind];
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.base,
        {
          backgroundColor: k.bg,
          borderColor: k.border,
          borderRadius: sz.borderRadius,
          paddingVertical: sz.paddingVertical,
          alignSelf: block ? 'stretch' : 'flex-start',
          opacity: disabled ? 0.5 : 1,
        },
        style,
      ]}
    >
      <Text style={[styles.label, { fontSize: sz.fontSize, color: k.fg }]}>{children}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    borderWidth: 1,
    gap: 7,
  },
  label: {
    fontFamily: fonts.sansSemiBold,
    letterSpacing: -0.1,
    lineHeight: 16,
  },
});
