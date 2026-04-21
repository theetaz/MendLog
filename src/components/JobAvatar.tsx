import { Image } from 'expo-image';
import { useMemo } from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { fonts, type ThemeColors, useColors } from '../design/tokens';

export interface AvatarPhoto {
  url: string;
  blurhash?: string | null;
}

interface JobAvatarProps {
  machine: string;
  photos?: AvatarPhoto[];
  size?: number;
  style?: ViewStyle;
  testID?: string;
}

const INITIAL_BG = [
  '#1E3A5F',
  '#166534',
  '#A16207',
  '#7C3AED',
  '#C2410C',
  '#0E7490',
  '#4338CA',
  '#9F1239',
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

export function JobAvatar({ machine, photos, size = 42, style, testID }: JobAvatarProps) {
  const colors = useColors();
  const themed = useMemo(() => makeThemedStyles(colors), [colors]);
  const dim: ViewStyle = { width: size, height: size };
  const available = (photos ?? []).filter((p) => !!p?.url).slice(0, 4);

  if (available.length === 0) {
    const bg = INITIAL_BG[hashString(machine) % INITIAL_BG.length] ?? INITIAL_BG[0];
    const initialsFontSize = Math.max(11, Math.round(size * 0.4));
    return (
      <View
        testID={testID}
        style={[themed.tile, dim, { backgroundColor: bg }, style]}
      >
        <Text style={[themed.initials, { fontSize: initialsFontSize }]}>
          {initialsFor(machine)}
        </Text>
      </View>
    );
  }

  return (
    <View testID={testID} style={[themed.tile, dim, style]}>
      <Collage photos={available} />
    </View>
  );
}

function Tile({ photo }: { photo: AvatarPhoto }) {
  return (
    <Image
      source={{ uri: photo.url }}
      placeholder={photo.blurhash ? { blurhash: photo.blurhash } : undefined}
      transition={200}
      contentFit="cover"
      style={StyleSheet.absoluteFill}
    />
  );
}

function Collage({ photos }: { photos: AvatarPhoto[] }) {
  if (photos.length === 1) {
    return <Tile photo={photos[0]!} />;
  }
  if (photos.length === 2) {
    return (
      <View style={layoutStyles.row}>
        <View style={layoutStyles.half}><Tile photo={photos[0]!} /></View>
        <View style={layoutStyles.half}><Tile photo={photos[1]!} /></View>
      </View>
    );
  }
  if (photos.length === 3) {
    return (
      <View style={layoutStyles.row}>
        <View style={layoutStyles.half}><Tile photo={photos[0]!} /></View>
        <View style={layoutStyles.half}>
          <View style={layoutStyles.half}><Tile photo={photos[1]!} /></View>
          <View style={layoutStyles.half}><Tile photo={photos[2]!} /></View>
        </View>
      </View>
    );
  }
  return (
    <View style={layoutStyles.row}>
      <View style={layoutStyles.half}>
        <View style={layoutStyles.half}><Tile photo={photos[0]!} /></View>
        <View style={layoutStyles.half}><Tile photo={photos[1]!} /></View>
      </View>
      <View style={layoutStyles.half}>
        <View style={layoutStyles.half}><Tile photo={photos[2]!} /></View>
        <View style={layoutStyles.half}><Tile photo={photos[3]!} /></View>
      </View>
    </View>
  );
}

const layoutStyles = StyleSheet.create({
  row: {
    flex: 1,
    flexDirection: 'row',
    width: '100%',
    height: '100%',
  },
  half: { flex: 1 },
});

const makeThemedStyles = (colors: ThemeColors) =>
  StyleSheet.create({
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
  });
