import { Pressable, StyleSheet, View } from 'react-native';
import { colors } from '../design/tokens';
import type { ActivityDay } from '../types/job';
import { heatColor } from '../utils/heat';

export type ContributionGridVariant = 'compact' | 'full';

interface ContributionGridProps {
  data: ActivityDay[];
  variant?: ContributionGridVariant;
  onCellTap?: (day: ActivityDay) => void;
}

function chunkByWeeks(days: ActivityDay[]): ActivityDay[][] {
  const weeks: ActivityDay[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }
  return weeks;
}

export function ContributionGrid({ data, variant = 'compact', onCellTap }: ContributionGridProps) {
  const weeks = chunkByWeeks(data);
  // compact = fixed-size cells (used in small tiles); full = fills parent width
  const compact = variant === 'compact';
  const gap = compact ? 3 : 2;
  const fixedCell = compact ? 12 : undefined;

  return (
    <View style={styles.grid}>
      {weeks.map((week, wi) => (
        <View
          key={`week-${wi}`}
          style={[
            compact ? styles.column : styles.columnFlex,
            { gap, marginLeft: wi === 0 ? 0 : gap },
          ]}
        >
          {week.map((day) => {
            const cellStyle = [
              compact
                ? { width: fixedCell, height: fixedCell, borderRadius: 3 }
                : styles.cellFlex,
              { backgroundColor: heatColor(day.count) },
            ];
            if (!onCellTap) {
              return <View key={day.date} testID={`cell-${day.date}`} style={cellStyle} />;
            }
            return (
              <Pressable
                key={day.date}
                testID={`cell-${day.date}`}
                onPress={() => onCellTap(day)}
                hitSlop={4}
                style={cellStyle}
              />
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', width: '100%' },
  column: { flexDirection: 'column' },
  columnFlex: { flexDirection: 'column', flex: 1 },
  cellFlex: {
    aspectRatio: 1,
    borderRadius: 2,
    width: '100%',
    minHeight: 2,
  },
});

export const __heatColorForTests = heatColor;
