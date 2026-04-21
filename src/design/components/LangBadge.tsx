import { StyleSheet, Text, View } from 'react-native';
import type { Lang } from '../../types/job';
import { fonts, useColors } from '../tokens';

interface LangBadgeProps {
  lang?: Lang;
}

export function LangBadge({ lang = 'en' }: LangBadgeProps) {
  const colors = useColors();
  const isSinhala = lang === 'si';
  return (
    <View style={[styles.badge, isSinhala ? styles.si : styles.en]}>
      <Text
        style={[
          styles.label,
          { color: isSinhala ? '#6A1E88' : colors.navy },
          isSinhala && styles.siLabel,
        ]}
      >
        {isSinhala ? 'සිං' : 'EN'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    minWidth: 28,
    height: 20,
    paddingHorizontal: 6,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  en: { backgroundColor: '#D8E7F5' },
  si: { backgroundColor: '#EAD8F0' },
  label: {
    fontSize: 11,
    fontFamily: fonts.sansBold,
    letterSpacing: 0.2,
  },
  siLabel: {
    fontFamily: fonts.sinhala,
  },
});
