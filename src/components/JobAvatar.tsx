import { Image, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { colors, fonts } from '../design/tokens';

interface JobAvatarProps {
  machine: string;
  photoUrls?: string[];
  size?: number;
  style?: ViewStyle;
  testID?: string;
}

const INITIAL_BG = [
  '#1E3A5F', // navy
  '#166534', // emerald deep
  '#A16207', // ochre
  '#7C3AED', // violet
  '#C2410C', // rust
  '#0E7490', // cyan
  '#4338CA', // indigo
  '#9F1239', // crimson
];

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

function initialsFor(machine: string): string {
  const trimmed = machine.trim();
  if (!trimmed) return '—';
  const firstWord = trimmed.split(/\s+/)[0] ?? '';
  const letters = firstWord.replace(/[^A-Za-z]/g, '');
  if (letters.length >= 2) return letters.slice(0, 2).toUpperCase();
  if (letters.length === 1) return letters.toUpperCase();
  return trimmed.slice(0, 2).toUpperCase();
}

export function JobAvatar({ machine, photoUrls, size = 42, style, testID }: JobAvatarProps) {
  const dim: ViewStyle = { width: size, height: size };
  const available = (photoUrls ?? []).filter(Boolean).slice(0, 4);

  if (available.length === 0) {
    const bg = INITIAL_BG[hashString(machine) % INITIAL_BG.length] ?? INITIAL_BG[0];
    const initialsFontSize = Math.max(11, Math.round(size * 0.4));
    return (
      <View
        testID={testID}
        style={[styles.tile, dim, { backgroundColor: bg }, style]}
      >
        <Text style={[styles.initials, { fontSize: initialsFontSize }]}>
          {initialsFor(machine)}
        </Text>
      </View>
    );
  }

  return (
    <View testID={testID} style={[styles.tile, dim, style]}>
      <Collage photoUrls={available} />
    </View>
  );
}

function Collage({ photoUrls }: { photoUrls: string[] }) {
  if (photoUrls.length === 1) {
    return <Image source={{ uri: photoUrls[0] }} style={StyleSheet.absoluteFill} resizeMode="cover" />;
  }
  if (photoUrls.length === 2) {
    return (
      <View style={styles.row}>
        <Image source={{ uri: photoUrls[0] }} style={styles.half} resizeMode="cover" />
        <Image source={{ uri: photoUrls[1] }} style={styles.half} resizeMode="cover" />
      </View>
    );
  }
  if (photoUrls.length === 3) {
    return (
      <View style={styles.row}>
        <Image source={{ uri: photoUrls[0] }} style={styles.half} resizeMode="cover" />
        <View style={styles.half}>
          <Image source={{ uri: photoUrls[1] }} style={styles.half} resizeMode="cover" />
          <Image source={{ uri: photoUrls[2] }} style={styles.half} resizeMode="cover" />
        </View>
      </View>
    );
  }
  // 4
  return (
    <View style={styles.row}>
      <View style={styles.half}>
        <Image source={{ uri: photoUrls[0] }} style={styles.half} resizeMode="cover" />
        <Image source={{ uri: photoUrls[1] }} style={styles.half} resizeMode="cover" />
      </View>
      <View style={styles.half}>
        <Image source={{ uri: photoUrls[2] }} style={styles.half} resizeMode="cover" />
        <Image source={{ uri: photoUrls[3] }} style={styles.half} resizeMode="cover" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontFamily: fonts.sansBold,
    color: '#fff',
    letterSpacing: 0.5,
  },
  row: {
    flex: 1,
    flexDirection: 'row',
    width: '100%',
    height: '100%',
  },
  half: {
    flex: 1,
  },
});
