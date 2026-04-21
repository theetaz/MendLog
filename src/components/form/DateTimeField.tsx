import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { fonts, radii, spacing, type ThemeColors, useColors } from '../../design/tokens';

interface DateTimeFieldProps {
  label: string;
  value: Date | null;
  onChange(next: Date | null): void;
  required?: boolean;
  optional?: boolean;
  error?: string | null;
  minimumDate?: Date;
  maximumDate?: Date;
}

type Mode = 'date' | 'time';

export function DateTimeField(props: DateTimeFieldProps) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>
          {props.label}
          {props.required && <Text style={styles.required}> *</Text>}
        </Text>
        {props.optional && !props.required && <Text style={styles.optional}>Optional</Text>}
      </View>

      {Platform.OS === 'ios' ? (
        <IosCompact {...props} styles={styles} colors={colors} />
      ) : (
        <AndroidButtons {...props} styles={styles} colors={colors} />
      )}

      {props.error && <Text style={styles.errorText}>{props.error}</Text>}
    </View>
  );
}

function IosCompact({
  value,
  onChange,
  minimumDate,
  maximumDate,
  required,
  styles,
}: DateTimeFieldProps & { styles: ReturnType<typeof makeStyles>; colors: ThemeColors }) {
  // iOS compact pickers are native small buttons that open their own popovers.
  // Keep two pickers (date + time) and render them side by side.
  const safeValue = value ?? new Date();
  return (
    <View style={styles.row}>
      <View style={styles.iosCell}>
        <DateTimePicker
          value={safeValue}
          mode="date"
          display="compact"
          onChange={(_: DateTimePickerEvent, next?: Date) => {
            if (!next) return;
            const merged = new Date(value ?? next);
            merged.setFullYear(next.getFullYear(), next.getMonth(), next.getDate());
            onChange(merged);
          }}
          minimumDate={minimumDate}
          maximumDate={maximumDate}
        />
      </View>
      <View style={styles.iosCell}>
        <DateTimePicker
          value={safeValue}
          mode="time"
          display="compact"
          onChange={(_: DateTimePickerEvent, next?: Date) => {
            if (!next) return;
            const merged = new Date(value ?? next);
            merged.setHours(next.getHours(), next.getMinutes(), 0, 0);
            onChange(merged);
          }}
        />
      </View>
      {!required && value && (
        <Pressable onPress={() => onChange(null)} hitSlop={8} style={styles.clearBtn}>
          <Text style={styles.clearText}>Clear</Text>
        </Pressable>
      )}
    </View>
  );
}

function AndroidButtons({
  value,
  onChange,
  required,
  minimumDate,
  maximumDate,
  styles,
}: DateTimeFieldProps & { styles: ReturnType<typeof makeStyles>; colors: ThemeColors }) {
  const [openMode, setOpenMode] = useState<Mode | null>(null);

  const handleChange = (_: DateTimePickerEvent, next?: Date) => {
    setOpenMode(null);
    if (!next) return;
    if (openMode === 'date' && value) {
      const merged = new Date(value);
      merged.setFullYear(next.getFullYear(), next.getMonth(), next.getDate());
      onChange(merged);
    } else if (openMode === 'time' && value) {
      const merged = new Date(value);
      merged.setHours(next.getHours(), next.getMinutes(), 0, 0);
      onChange(merged);
    } else {
      onChange(next);
    }
  };

  const open = (mode: Mode) => {
    if (!value) onChange(new Date());
    setOpenMode(mode);
  };

  return (
    <View style={styles.row}>
      <Pressable
        onPress={() => open('date')}
        style={({ pressed }) => [styles.cell, pressed && styles.pressed]}
      >
        <Text style={[styles.cellValue, !value && styles.cellPlaceholder]}>
          {value ? formatDate(value) : 'Pick date'}
        </Text>
      </Pressable>
      <Pressable
        onPress={() => open('time')}
        style={({ pressed }) => [styles.cell, pressed && styles.pressed]}
      >
        <Text style={[styles.cellValue, !value && styles.cellPlaceholder]}>
          {value ? formatTime(value) : 'Pick time'}
        </Text>
      </Pressable>
      {value && !required && (
        <Pressable onPress={() => onChange(null)} hitSlop={8} style={styles.clearBtn}>
          <Text style={styles.clearText}>Clear</Text>
        </Pressable>
      )}

      {openMode && (
        <DateTimePicker
          value={value ?? new Date()}
          mode={openMode}
          display="default"
          onChange={handleChange}
          minimumDate={minimumDate}
          maximumDate={maximumDate}
        />
      )}
    </View>
  );
}

function formatDate(d: Date): string {
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' });
}

function formatTime(d: Date): string {
  return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { gap: 6 },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 12,
    color: colors.muteDeep,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  required: { color: colors.red },
  optional: {
    fontFamily: fonts.sans,
    fontSize: 11,
    color: colors.mute,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iosCell: {
    flex: 0,
  },
  cell: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
  pressed: { opacity: 0.85 },
  cellValue: {
    fontFamily: fonts.sans,
    fontSize: 15,
    color: colors.text,
  },
  cellPlaceholder: { color: colors.mute },
  clearBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  clearText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 12,
    color: colors.mute,
  },
  errorText: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.red,
  },
});
