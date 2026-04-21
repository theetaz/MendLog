import { useMemo, useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon } from '../design/components/Icon';
import { colors, fonts, radii, spacing } from '../design/tokens';
import type { ActivityDay } from '../types/job';
import { heatColor } from '../utils/heat';

interface MonthHeatmapProps {
  counts: Map<string, number>;
  clock?: () => Date;
  onOpenDay(dateIso: string): void;
  /** Total months shown, ending with the current month. Default 3. */
  months?: number;
}

interface MonthGrid {
  year: number;
  month: number;
  label: string;
  weeks: { day: ActivityDay; inMonth: boolean }[][];
}

function isoLocal(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function buildMonth(
  year: number,
  month: number,
  counts: Map<string, number>,
): MonthGrid {
  const first = new Date(year, month, 1);
  const dowFirst = (first.getDay() + 6) % 7;
  const start = new Date(year, month, 1 - dowFirst);

  const last = new Date(year, month + 1, 0);
  const dowLast = (last.getDay() + 6) % 7;
  const end = new Date(last);
  end.setDate(last.getDate() + (6 - dowLast));

  const cells: { day: ActivityDay; inMonth: boolean }[] = [];
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const iso = isoLocal(d);
    cells.push({
      day: { date: iso, count: counts.get(iso) ?? 0 },
      inMonth: d.getMonth() === month,
    });
  }

  const weeks: { day: ActivityDay; inMonth: boolean }[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  const label = first.toLocaleDateString(undefined, { month: 'short' });
  return { year, month, label, weeks };
}

function trailingMonths(anchor: Date, n: number): Array<{ year: number; month: number }> {
  const out: Array<{ year: number; month: number }> = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(anchor.getFullYear(), anchor.getMonth() - i, 1);
    out.push({ year: d.getFullYear(), month: d.getMonth() });
  }
  return out;
}

function formatLongDate(dateIso: string): string {
  const [y, m, d] = dateIso.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });
}

const CELL_GAP = 2;
const MONTH_GAP = 10;
const LABEL_COL_WIDTH = 26;

export function MonthHeatmap({
  counts,
  clock = () => new Date(),
  onOpenDay,
  months = 3,
}: MonthHeatmapProps) {
  const [width, setWidth] = useState(0);
  const [selected, setSelected] = useState<ActivityDay | null>(null);

  const grids = useMemo(() => {
    const list = trailingMonths(clock(), months);
    return list.map(({ year, month }) => buildMonth(year, month, counts));
  }, [clock, counts, months]);

  const cellSize = useMemo(() => {
    if (width === 0 || grids.length === 0) return 0;
    // Each month has up to 6 week columns.
    const totalWeekCols = grids.reduce((sum, g) => sum + g.weeks.length, 0);
    const gridGaps = grids.reduce((sum, g) => sum + (g.weeks.length - 1) * CELL_GAP, 0);
    const monthGaps = (grids.length - 1) * MONTH_GAP;
    const avail = width - LABEL_COL_WIDTH - gridGaps - monthGaps;
    const raw = avail / totalWeekCols;
    return Math.max(8, Math.min(22, Math.floor(raw)));
  }, [width, grids]);

  const handleLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w !== width) setWidth(w);
  };

  return (
    <View onLayout={handleLayout} style={styles.container}>
      {cellSize > 0 && (
        <>
          <View style={styles.monthRow}>
            <View style={{ width: LABEL_COL_WIDTH }} />
            {grids.map((g, gi) => {
              const gridWidth = g.weeks.length * cellSize + (g.weeks.length - 1) * CELL_GAP;
              return (
                <View
                  key={`lbl-${g.year}-${g.month}`}
                  style={{
                    width: gridWidth,
                    marginLeft: gi === 0 ? 0 : MONTH_GAP,
                  }}
                >
                  <Text style={styles.monthLabel}>{g.label}</Text>
                </View>
              );
            })}
          </View>

          <View style={styles.gridRow}>
            <View style={[styles.weekdayCol, { gap: CELL_GAP }]}>
              {Array.from({ length: 7 }, (_, row) => (
                <View
                  key={`wd-${row}`}
                  style={{ height: cellSize, justifyContent: 'center' }}
                >
                  <Text style={styles.weekdayLabel}>
                    {row === 1 ? 'Mon' : row === 3 ? 'Wed' : row === 5 ? 'Fri' : ''}
                  </Text>
                </View>
              ))}
            </View>

            {grids.map((g, gi) => (
              <View
                key={`g-${g.year}-${g.month}`}
                style={[styles.monthGrid, { gap: CELL_GAP, marginLeft: gi === 0 ? 0 : MONTH_GAP }]}
              >
                {g.weeks.map((week, wi) => (
                  <View key={`w-${wi}`} style={{ gap: CELL_GAP }}>
                    {week.map(({ day, inMonth }) => {
                      const bg = inMonth ? heatColor(day.count) : colors.lineSoft;
                      return (
                        <Pressable
                          key={day.date}
                          testID={`cell-${day.date}`}
                          onPress={() => inMonth && setSelected(day)}
                          disabled={!inMonth}
                          hitSlop={CELL_GAP}
                          style={[
                            {
                              width: cellSize,
                              height: cellSize,
                              borderRadius: Math.max(2, Math.floor(cellSize / 4)),
                              backgroundColor: bg,
                            },
                            !inMonth && styles.cellOutside,
                            selected?.date === day.date && styles.cellSelected,
                          ]}
                        />
                      );
                    })}
                  </View>
                ))}
              </View>
            ))}
          </View>
        </>
      )}

      {selected && (
        <View style={styles.tooltipCard}>
          <View style={styles.tooltipTextWrap}>
            <Text style={styles.tooltipCount}>
              {selected.count === 0
                ? 'No jobs'
                : selected.count === 1
                  ? '1 job'
                  : `${selected.count} jobs`}
            </Text>
            <Text style={styles.tooltipDate}>{formatLongDate(selected.date)}</Text>
          </View>
          {selected.count > 0 && (
            <Pressable
              onPress={() => {
                onOpenDay(selected.date);
                setSelected(null);
              }}
              style={({ pressed }) => [styles.tooltipBtn, pressed && styles.pressed]}
            >
              <Text style={styles.tooltipBtnText}>Open day</Text>
            </Pressable>
          )}
          <Pressable onPress={() => setSelected(null)} hitSlop={8} style={styles.tooltipClose}>
            <Icon name="x" size={14} color={colors.mute} weight={2} />
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  monthRow: { flexDirection: 'row', alignItems: 'flex-end' },
  monthLabel: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 10.5,
    color: colors.muteDeep,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  gridRow: { flexDirection: 'row', alignItems: 'flex-start' },
  weekdayCol: { width: LABEL_COL_WIDTH, flexDirection: 'column' },
  weekdayLabel: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 9.5,
    color: colors.mute,
    letterSpacing: 0.3,
  },
  monthGrid: { flexDirection: 'row' },
  cellOutside: { opacity: 0.4 },
  cellSelected: {
    borderWidth: 1.5,
    borderColor: colors.text,
  },
  pressed: { opacity: 0.85 },
  tooltipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm + 2,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  tooltipTextWrap: { flex: 1 },
  tooltipCount: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 14,
    color: colors.text,
  },
  tooltipDate: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.mute,
    marginTop: 1,
  },
  tooltipBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderRadius: radii.pill,
    backgroundColor: colors.navy,
  },
  tooltipBtnText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 12,
    color: '#fff',
    letterSpacing: 0.3,
  },
  tooltipClose: { padding: 4 },
});
