import * as ImagePicker from 'expo-image-picker';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon } from '../../design/components/Icon';
import { useMemo } from 'react';
import { fonts, radii, spacing, type ThemeColors, useColors } from '../../design/tokens';

export interface StagedPhoto {
  uri: string;
  width: number;
  height: number;
  mimeType: string;
}

interface PhotoGridProps {
  label: string;
  photos: StagedPhoto[];
  onChange(next: StagedPhoto[]): void;
  max?: number;
}

export function PhotoGrid({ label, photos, onChange, max = 10 }: PhotoGridProps) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const atMax = photos.length >= max;

  const pickFrom = async (source: 'camera' | 'library') => {
    try {
      const perm =
        source === 'camera'
          ? await ImagePicker.requestCameraPermissionsAsync()
          : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(
          'Permission needed',
          source === 'camera'
            ? 'Enable camera access to take photos.'
            : 'Enable photo library access to attach photos.',
        );
        return;
      }

      const pickerOptions: ImagePicker.ImagePickerOptions = {
        mediaTypes: ['images'],
        quality: 0.85,
        exif: false,
      };

      const result =
        source === 'camera'
          ? await ImagePicker.launchCameraAsync(pickerOptions)
          : await ImagePicker.launchImageLibraryAsync({
              ...pickerOptions,
              allowsMultipleSelection: true,
              selectionLimit: Math.max(1, max - photos.length),
            });

      if (result.canceled) return;
      const next: StagedPhoto[] = result.assets.map((a) => ({
        uri: a.uri,
        width: a.width ?? 0,
        height: a.height ?? 0,
        mimeType: a.mimeType ?? 'image/jpeg',
      }));
      onChange([...photos, ...next].slice(0, max));
    } catch (e) {
      Alert.alert('Could not attach photo', e instanceof Error ? e.message : 'Unknown error');
    }
  };

  const handleAdd = () => {
    if (atMax) return;
    Alert.alert('Add photo', undefined, [
      { text: 'Take photo', onPress: () => pickFrom('camera') },
      { text: 'Choose from library', onPress: () => pickFrom('library') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleRemove = (uri: string) => {
    onChange(photos.filter((p) => p.uri !== uri));
  };

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.count}>
          {photos.length}/{max}
        </Text>
      </View>
      <View style={styles.grid}>
        {photos.map((photo) => (
          <View key={photo.uri} style={styles.tile}>
            <Image source={{ uri: photo.uri }} style={styles.tileImg} />
            <Pressable
              onPress={() => handleRemove(photo.uri)}
              style={({ pressed }) => [styles.removeBtn, pressed && styles.pressed]}
              hitSlop={6}
            >
              <Icon name="x" size={14} color="#fff" weight={2.5} />
            </Pressable>
          </View>
        ))}
        {!atMax && (
          <Pressable
            onPress={handleAdd}
            style={({ pressed }) => [styles.addBtn, pressed && styles.pressed]}
          >
            <Icon name="plus" size={24} color={colors.navy} weight={2} />
            <Text style={styles.addLabel}>Add</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const TILE_SIZE = 92;

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { gap: 8 },
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
  count: {
    fontFamily: fonts.mono,
    fontSize: 12,
    color: colors.mute,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tile: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    borderRadius: radii.md,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: colors.line,
  },
  tileImg: { width: '100%', height: '100%' },
  removeBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.8 },
  addBtn: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    borderStyle: 'dashed',
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  addLabel: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 11,
    color: colors.navy,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
});
