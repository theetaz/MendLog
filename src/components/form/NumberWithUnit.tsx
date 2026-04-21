import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useMemo } from 'react';
import { fonts, radii, spacing, type ThemeColors, useColors } from '../../design/tokens';

export type TimeUnit = 'minutes' | 'hours';

interface NumberWithUnitProps {
  label: string;
  value: number;
  unit: TimeUnit;
  onChange(next: { value: number; unit: TimeUnit }): void;
  required?: boolean;
  error?: string | null;
}

export function NumberWithUnit({
  label,
  value,
  unit,
  onChange,
  required,
  error,
}: NumberWithUnitProps) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const handleText = (text: string) => {
    const cleaned = text.replace(/[^0-9.]/g, '');
    const num = cleaned === '' ? 0 : Number(cleaned);
    onChange({ value: Number.isFinite(num) ? num : 0, unit });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        {label}
        {required && <Text style={styles.required}> *</Text>}
      </Text>
      <View style={styles.row}>
        <TextInput
          style={styles.input}
          keyboardType="decimal-pad"
          value={value === 0 ? '' : String(value)}
          placeholder="0"
          placeholderTextColor={colors.mute}
          onChangeText={handleText}
        />
        <View style={styles.segment}>
          <UnitBtn
            label="min"
            active={unit === 'minutes'}
            onPress={() => onChange({ value, unit: 'minutes' })}
            styles={styles}
          />
          <UnitBtn
            label="hr"
            active={unit === 'hours'}
            onPress={() => onChange({ value, unit: 'hours' })}
            styles={styles}
          />
        </View>
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

function UnitBtn({
  label,
  active,
  onPress,
  styles,
}: {
  label: string;
  active: boolean;
  onPress(): void;
  styles: ReturnType<typeof makeStyles>;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.unitBtn,
        active && styles.unitBtnActive,
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.unitBtnText, active && styles.unitBtnTextActive]}>{label}</Text>
    </Pressable>
  );
}

export function toMinutes(value: number, unit: TimeUnit): number {
  return Math.round(unit === 'hours' ? value * 60 : value);
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { gap: 6 },
  label: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 12,
    color: colors.muteDeep,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  required: { color: colors.red },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    fontFamily: fonts.mono,
    fontSize: 16,
    color: colors.text,
  },
  segment: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  unitBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    minWidth: 52,
    alignItems: 'center',
  },
  unitBtnActive: { backgroundColor: colors.navy },
  pressed: { opacity: 0.8 },
  unitBtnText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 13,
    color: colors.text,
  },
  unitBtnTextActive: { color: '#fff' },
  errorText: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.red,
  },
});
