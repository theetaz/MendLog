import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { JobSyncState } from '../../offline/syncState';
import { SYNC_STATE_LABEL } from '../../offline/syncState';
import { fonts, radii, type ThemeColors, useColors } from '../tokens';
import { Icon, type IconName } from './Icon';

// Visual badge that pairs a cloud-family icon with a status tone. The same
// component covers both the compact (icon-only) use on JobCard and the
// labelled use on JobDetail / the Me screen.

type Paint = { icon: IconName; fg: string; bg: string };

function paint(state: JobSyncState, colors: ThemeColors): Paint {
  switch (state) {
    case 'synced':
      return { icon: 'cloud_check', fg: colors.emerald, bg: colors.emeraldSoft };
    case 'processing':
      return { icon: 'cloud_dots', fg: colors.navySoft, bg: colors.lineSoft };
    case 'uploading':
      return { icon: 'cloud_up', fg: colors.amber, bg: colors.amberSoft };
    case 'error':
      return { icon: 'cloud_alert', fg: colors.red, bg: colors.redSoft };
    case 'offline':
      return { icon: 'cloud_off', fg: colors.mute, bg: colors.lineSoft };
  }
}

interface SyncBadgeProps {
  state: JobSyncState;
  variant?: 'compact' | 'full';
  testID?: string;
}

export function SyncBadge({ state, variant = 'full', testID }: SyncBadgeProps) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { icon, fg, bg } = useMemo(() => paint(state, colors), [colors, state]);

  if (variant === 'compact') {
    return (
      <View style={[styles.compact, { backgroundColor: bg }]} testID={testID}>
        <Icon name={icon} size={14} color={fg} weight={1.75} />
      </View>
    );
  }

  return (
    <View style={[styles.full, { backgroundColor: bg }]} testID={testID}>
      <Icon name={icon} size={14} color={fg} weight={1.75} />
      <Text style={[styles.label, { color: fg }]}>{SYNC_STATE_LABEL[state]}</Text>
    </View>
  );
}

const makeStyles = (_colors: ThemeColors) =>
  StyleSheet.create({
    compact: {
      width: 24,
      height: 24,
      borderRadius: radii.pill,
      alignItems: 'center',
      justifyContent: 'center',
    },
    full: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 9,
      paddingVertical: 4,
      borderRadius: radii.pill,
    },
    label: {
      fontSize: 11,
      fontFamily: fonts.sansMedium,
      letterSpacing: 0.1,
    },
  });
