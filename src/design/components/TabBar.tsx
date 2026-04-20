import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../tokens';
import { Icon, type IconName } from './Icon';

export type TabId = 'home' | 'jobs' | 'new' | 'search' | 'me';

interface TabBarProps {
  active: TabId;
  onTab?: (id: TabId) => void;
}

interface TabItem {
  id: TabId;
  label?: string;
  icon: IconName;
  fab?: boolean;
}

const ITEMS: TabItem[] = [
  { id: 'home', label: 'Home', icon: 'home' },
  { id: 'jobs', label: 'Jobs', icon: 'list' },
  { id: 'new', icon: 'plus', fab: true },
  { id: 'search', label: 'Search', icon: 'search' },
  { id: 'me', label: 'Me', icon: 'user' },
];

export function TabBar({ active, onTab }: TabBarProps) {
  return (
    <View style={styles.bar}>
      {ITEMS.map((item) => {
        if (item.fab) {
          return (
            <Pressable
              key={item.id}
              testID={`tab-${item.id}`}
              onPress={() => onTab?.(item.id)}
              style={styles.fab}
            >
              <Icon name={item.icon} size={28} color={colors.ink} weight={2.2} />
            </Pressable>
          );
        }
        const selected = active === item.id;
        const tint = selected ? colors.navy : colors.mute;
        return (
          <Pressable
            key={item.id}
            testID={`tab-${item.id}`}
            onPress={() => onTab?.(item.id)}
            style={styles.tab}
          >
            <Icon name={item.icon} size={20} color={tint} weight={selected ? 2 : 1.5} />
            <Text style={[styles.label, { color: tint, fontFamily: selected ? fonts.sansSemiBold : fonts.sansMedium }]}>
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'space-between',
    gap: 4,
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 10,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    gap: 3,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 18,
    marginTop: -14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.yellow,
    shadowColor: colors.yellow,
    shadowOpacity: 0.5,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  label: {
    fontSize: 10,
    letterSpacing: 0.1,
  },
});
