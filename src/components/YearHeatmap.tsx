import { useMemo, useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon } from '../design/components/Icon';
import { fonts, radii, spacing, type ThemeColors, useColors } from '../design/tokens';
import type { ActivityDay } from '../types/job';
import { heatColor } from '../utils/heat';

interface YearHeatmapProps {
  data: ActivityDay[];
  onOpenDay(dateIso: string): void;
}

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

// Chunk into weeks of 7. Assumes `data` is ordered oldest-first.
function chunkWeeks(days: ActivityDay[]): ActivityDay[][] {
  const weeks: ActivityDay[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }
  return weeks;
}

// For each week column, return the month label to render above it
// (only when the first day of the week is also in a new month vs. previous week).
function computeMonthLabels(weeks: ActivityDay[][]): (string | null)[] {
  const labels: (string | null)[] = [];
  let lastMonth = -1;
  for (const week of weeks) {
    const first = week[0];
    if (!first) {
      labels.push(null);
      continue;
    }
    const month = Number(first.date.slice(5, 7)) - 1;
    if (month !== lastMonth) {
      labels.push(MONTH_NAMES[month] ?? null);
      lastMonth = month;
    } else {
      labels.push(null);
    }
  }
  return labels;
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

const LABEL_COL_WIDTH = 26;
const GAP = 2;

export function YearHeatmap({ data, onOpenDay }: YearHeatmapProps) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [containerWidth, setContainerWidth] = useState(0);
  const [selected, setSelected] = useState<ActivityDay | null>(null);

  const weeks = useMemo(() => chunkWeeks(data), [data]);
  const monthLabels = useMemo(() => computeMonthLabels(weeks), [weeks]);

  const cellSize = useMemo(() => {
    if (containerWidth === 0 || weeks.length === 0) return 0;
    const avail = containerWidth - LABEL_COL_WIDTH;
    const raw = (avail - (weeks.length - 1) * GAP) / weeks.length;
    return Math.max(4, Math.floor(raw));
  }, [containerWidth, weeks.length]);

  const handleLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w !== containerWidth) setContainerWidth(w);
  };

  return (
    <View onLayout={handleLayout} style={styles.container}>
      {cellSize > 0 && (
        <>
          <View style={styles.monthRow}>
            <View style={{ width: LABEL_COL_WIDTH }} />
            <View style={styles.monthRowGrid}>
              {monthLabels.map((label, wi) => (
                <View
                  key={`m-${wi}`}
                  style={{
                    width: cellSize,
                    marginLeft: wi === 0 ? 0 : GAP,
                  }}
                >
                  {label && <Text style={styles.monthLabel}>{label}</Text>}
                </View>
              ))}
            </View>
          </View>

          <View style={styles.gridRow}>
            <View style={[styles.weekdayCol, { gap: GAP }]}>
              {Array.from({ length: 7 }, (_, row) => (
                <View key={`wd-${row}`} style={{ height: cellSize, justifyContent: 'center' }}>
                  <Text style={styles.weekdayLabel}>
                    {row === 1 ? 'Mon' : row === 3 ? 'Wed' : row === 5 ? 'Fri' : ''}
                  </Text>
                </View>
              ))}
            </View>

            <View style={[styles.grid, { gap: GAP }]}>
              {weeks.map((week, wi) => (
                <View key={`w-${wi}`} style={{ gap: GAP }}>
                  {week.map((day) => (
                    <Pressable
                      key={day.date}
                      testID={`cell-${day.date}`}
                      onPress={() => setSelected(day)}
                      hitSlop={GAP}
                      style={[
                        {
                          width: cellSize,
                          height: cellSize,
                          borderRadius: Math.max(1, Math.floor(cellSize / 4)),
                          backgroundColor: heatColor(day.count, colors),
                        },
                        selected?.date === day.date && styles.cellSelected,
                      ]}
                    />
                  ))}
                </View>
              ))}
            </View>
          </View>

          <Legend styles={styles} colors={colors} />

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
                  <Icon name="home" size={14} color="#fff" weight={2.5} />
                </Pressable>
              )}
              <Pressable
                onPress={() => setSelected(null)}
                hitSlop={8}
                style={styles.tooltipClose}
              >
                <Icon name="x" size={14} color={colors.mute} weight={2} />
              </Pressable>
            </View>
          )}
        </>
      )}
    </View>
  );
}

function Legend({
  styles,
  colors,
}: {
  styles: ReturnType<typeof makeStyles>;
  colors: ThemeColors;
}) {
  return (
    <View style={styles.legendRow}>
      <Text style={styles.legendText}>Less</Text>
      {[0, 1, 3, 5, 8].map((count, i) => (
        <View
          key={i}
          style={[styles.legendSwatch, { backgroundColor: heatColor(count, colors) }]}
        />
      ))}
      <Text style={styles.legendText}>More</Text>
    </View>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { gap: 6 },
  monthRow: { flexDirection: 'row' },
  monthRowGrid: { flexDirection: 'row', flex: 1 },
  monthLabel: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 10,
    color: colors.muteDeep,
    letterSpacing: 0.3,
  },
  gridRow: { flexDirection: 'row' },
  weekdayCol: {
    width: LABEL_COL_WIDTH,
    flexDirection: 'column',
  },
  weekdayLabel: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 9.5,
    color: colors.mute,
    letterSpacing: 0.3,
  },
  grid: { flexDirection: 'row', flex: 1 },
  cellSelected: {
    borderWidth: 1.5,
    borderColor: colors.text,
  },
  pressed: { opacity: 0.85 },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: 6,
    paddingLeft: LABEL_COL_WIDTH,
  },
  legendText: {
    fontFamily: fonts.sans,
    fontSize: 10,
    color: colors.mute,
  },
  legendSwatch: {
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  tooltipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
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
  tooltipClose: {
    padding: 4,
  },
});
