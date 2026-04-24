import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon } from '../../design/components/Icon';
import { fonts, radii, spacing, type ThemeColors, useColors } from '../../design/tokens';
import type { Job } from '../../types/job';
import { heatColor } from '../../utils/heat';
import { localDateIso } from '../../utils/localDate';

interface CalendarViewProps {
  jobs?: Job[];
  counts?: Map<string, number>;
  clock?: () => Date;
  selectedDate?: string | null;
  onSelectDate?(dateIso: string | null): void;
  onOpenDay?(dateIso: string): void;
}

const WEEKDAY_HEADERS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function countsByDate(jobs: Job[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const job of jobs) {
    map.set(job.date, (map.get(job.date) ?? 0) + 1);
  }
  return map;
}

export interface MonthCell {
  date: string;
  day: number;
  inMonth: boolean;
  count: number;
}

export function buildMonthGrid(year: number, month: number, counts: Map<string, number>): MonthCell[] {
  const first = new Date(year, month, 1);
  const dow = (first.getDay() + 6) % 7; // 0 = Monday
  const start = new Date(year, month, 1 - dow);

  const out: MonthCell[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const iso = localDateIso(d);
    out.push({
      date: iso,
      day: d.getDate(),
      inMonth: d.getMonth() === month,
      count: counts.get(iso) ?? 0,
    });
  }
  return out;
}

export function CalendarView({
  jobs,
  counts: countsProp,
  clock = () => new Date(),
  selectedDate = null,
  onSelectDate,
  onOpenDay,
}: CalendarViewProps) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const now = clock();
  const [cursor, setCursor] = useState<{ year: number; month: number }>({
    year: now.getFullYear(),
    month: now.getMonth(),
  });

  const counts = useMemo(
    () => countsProp ?? (jobs ? countsByDate(jobs) : new Map<string, number>()),
    [countsProp, jobs],
  );

  const cells = useMemo(
    () => buildMonthGrid(cursor.year, cursor.month, counts),
    [counts, cursor.month, cursor.year],
  );
  const todayIso = localDateIso(now);

  const monthLabel = new Date(cursor.year, cursor.month, 1).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });

  const goMonth = (delta: number) => {
    setCursor((c) => {
      const d = new Date(c.year, c.month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  };

  const goToday = () => setCursor({ year: now.getFullYear(), month: now.getMonth() });

  const handleCellPress = (cell: MonthCell) => {
    if (onSelectDate) {
      onSelectDate(selectedDate === cell.date ? null : cell.date);
    } else {
      onOpenDay?.(cell.date);
    }
  };

  // Split into 6 rows of 7 for flex-based grid that fills screen width.
  const rows = useMemo(() => {
    const out: MonthCell[][] = [];
    for (let i = 0; i < cells.length; i += 7) out.push(cells.slice(i, i + 7));
    return out;
  }, [cells]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable
          onPress={() => goMonth(-1)}
          hitSlop={8}
          style={({ pressed }) => [styles.navBtn, pressed && styles.pressed]}
        >
          <Icon name="chevron-left" size={18} color={colors.navy} weight={2} />
        </Pressable>
        <Pressable onPress={goToday} hitSlop={8} style={styles.monthLabelWrap}>
          <Text style={styles.monthLabel}>{monthLabel}</Text>
          <Text style={styles.monthHint}>Tap to jump to today</Text>
        </Pressable>
        <Pressable
          onPress={() => goMonth(1)}
          hitSlop={8}
          style={({ pressed }) => [styles.navBtn, pressed && styles.pressed]}
        >
          <Icon name="chevron-right" size={18} color={colors.navy} weight={2} />
        </Pressable>
      </View>

      <View style={styles.weekHeader}>
        {WEEKDAY_HEADERS.map((w) => (
          <View key={w} style={styles.weekHeaderCell}>
            <Text style={styles.weekHeaderLabel}>{w}</Text>
          </View>
        ))}
      </View>

      <View style={styles.grid}>
        {rows.map((row, ri) => (
          <View key={`row-${ri}`} style={styles.row}>
            {row.map((cell) => {
              const isToday = cell.date === todayIso;
              const isSelected = selectedDate === cell.date;
              const disabled = !cell.inMonth;
              return (
                <Pressable
                  key={cell.date}
                  onPress={() => handleCellPress(cell)}
                  disabled={disabled}
                  style={({ pressed }) => [
                    styles.cell,
                    {
                      backgroundColor: cell.count > 0 ? heatColor(cell.count, colors) : colors.surface,
                      borderColor: isSelected ? colors.text : isToday ? colors.navy : colors.line,
                      borderWidth: isSelected || isToday ? 2 : 1,
                      opacity: cell.inMonth ? 1 : 0.4,
                    },
                    pressed && !disabled && styles.pressed,
                  ]}
                >
                  <Text
                    style={[
                      styles.cellNumber,
                      cell.count > 2 && styles.cellNumberOnDark,
                    ]}
                  >
                    {cell.day}
                  </Text>
                  {cell.count > 0 && (
                    <Text
                      style={[
                        styles.cellCount,
                        cell.count > 2 && styles.cellCountOnDark,
                      ]}
                    >
                      {cell.count}
                    </Text>
                  )}
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { gap: spacing.md },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.85 },
  monthLabelWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthLabel: {
    fontFamily: fonts.sansBold,
    fontSize: 18,
    color: colors.text,
    letterSpacing: -0.3,
  },
  monthHint: {
    fontFamily: fonts.sans,
    fontSize: 10.5,
    color: colors.mute,
    marginTop: 1,
  },
  weekHeader: {
    flexDirection: 'row',
    gap: 4,
  },
  weekHeaderCell: {
    flex: 1,
    alignItems: 'center',
  },
  weekHeaderLabel: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 10,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: colors.muteDeep,
  },
  grid: {
    gap: 4,
  },
  row: {
    flexDirection: 'row',
    gap: 4,
  },
  cell: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: radii.md,
    padding: 4,
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cellNumber: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 12,
    color: colors.text,
  },
  cellNumberOnDark: { color: '#fff' },
  cellCount: {
    alignSelf: 'flex-end',
    fontFamily: fonts.mono,
    fontSize: 10,
    color: colors.text,
  },
  cellCountOnDark: { color: '#fff' },
});
