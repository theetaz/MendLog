import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../design/tokens';
import type { ActivityDay } from '../types/job';
import { heatColor } from '../utils/heat';

export type ContributionGridVariant = 'compact' | 'full';

interface ContributionGridProps {
  data: ActivityDay[];
  variant?: ContributionGridVariant;
  onCellTap?: (day: ActivityDay) => void;
}

const WEEKDAY_LABELS = ['', 'Mon', '', 'Wed', '', 'Fri', ''];

function chunkByWeeks(days: ActivityDay[]): ActivityDay[][] {
  const weeks: ActivityDay[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }
  return weeks;
}

export function ContributionGrid({ data, variant = 'compact', onCellTap }: ContributionGridProps) {
  const weeks = chunkByWeeks(data);
  const cellSize = variant === 'full' ? 11 : 12;
  const gap = 3;

  return (
    <View>
      <View style={styles.row}>
        {variant === 'full' && (
          <View style={[styles.weekdayColumn, { gap }]}>
            {WEEKDAY_LABELS.map((label, idx) => (
              <Text key={idx} style={[styles.weekdayLabel, { height: cellSize }]}>
                {label}
              </Text>
            ))}
          </View>
        )}
        <View style={[styles.grid, { gap }]}>
          {weeks.map((week, wi) => (
            <View key={`week-${wi}`} style={[styles.column, { gap }]}>
              {week.map((day) => {
                const cellStyle = [
                  styles.cell,
                  { width: cellSize, height: cellSize, backgroundColor: heatColor(day.count) },
                ];
                if (!onCellTap) {
                  return <View key={day.date} testID={`cell-${day.date}`} style={cellStyle} />;
                }
                return (
                  <Pressable
                    key={day.date}
                    testID={`cell-${day.date}`}
                    onPress={() => onCellTap(day)}
                    style={cellStyle}
                  />
                );
              })}
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row' },
  weekdayColumn: {
    flexDirection: 'column',
    marginRight: 4,
    width: 22,
    paddingTop: 2,
  },
  weekdayLabel: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 9,
    color: colors.mute,
    letterSpacing: 0.3,
  },
  grid: { flexDirection: 'row' },
  column: { flexDirection: 'column' },
  cell: { borderRadius: 3 },
});
