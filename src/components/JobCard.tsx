import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, radii } from '../design/tokens';
import { Icon } from '../design/components/Icon';
import { LangBadge } from '../design/components/LangBadge';
import { Pill } from '../design/components/Pill';
import type { Job } from '../types/job';
import { formatIdle } from '../utils/idle';
import { PhotoBox } from './PhotoBox';
import { statusTone } from './jobStatus';

export type JobCardVariant = 'full' | 'horizontal' | 'compact';

interface JobCardProps {
  job: Job;
  variant?: JobCardVariant;
  onPress?: () => void;
  testID?: string;
}

export function JobCard({ job, variant = 'full', onPress, testID }: JobCardProps) {
  const tone = statusTone(job.status);
  const idle = formatIdle(job.idleMinutes);

  if (variant === 'compact') {
    return (
      <Pressable testID={testID} onPress={onPress} style={styles.compactCard}>
        <PhotoBox seed={job.id} size={42} style={styles.compactPhoto} />
        <View style={styles.compactBody}>
          <View style={styles.compactHeader}>
            <Text style={styles.compactId}>#{job.id}</Text>
            <LangBadge lang={job.lang} />
            <View style={styles.compactStatus}>
              <Pill bg={tone.bg} color={tone.fg}>
                {tone.label}
              </Pill>
            </View>
          </View>
          <Text style={styles.compactMachine} numberOfLines={1}>
            {job.machine}
          </Text>
          <Text style={styles.compactIdle}>{idle} idle</Text>
        </View>
      </Pressable>
    );
  }

  if (variant === 'horizontal') {
    return (
      <Pressable testID={testID} onPress={onPress} style={styles.horizontalCard}>
        <View style={styles.timePill}>
          <Text style={styles.timeText}>{job.time}</Text>
        </View>
        <View style={styles.horizontalBody}>
          <Text style={styles.horizontalMachine} numberOfLines={1}>
            {job.machine}
          </Text>
          <Text style={styles.horizontalMeta}>
            {job.dept} · {idle} idle
          </Text>
        </View>
        <Pill bg={tone.bg} color={tone.fg}>
          {tone.label}
        </Pill>
      </Pressable>
    );
  }

  return (
    <Pressable testID={testID} onPress={onPress} style={styles.fullCard}>
      <View style={styles.fullBody}>
        <View style={styles.fullHeader}>
          <Text style={styles.fullId}>#{job.id}</Text>
          <Pill bg={tone.bg} color={tone.fg}>
            {tone.label}
          </Pill>
          <View style={styles.spacer} />
          <LangBadge lang={job.lang} />
        </View>
        <Text style={styles.fullMachine}>{job.machine}</Text>
        <Text style={styles.fullMeta}>
          {job.dept} · {job.time} · {idle} idle
        </Text>
        <Text style={styles.fullRoot} numberOfLines={2}>
          {job.rootCause}
        </Text>
        <View style={styles.fullFooter}>
          <View style={styles.countChip}>
            <Icon name="photo" size={12} color={colors.mute} />
            <Text style={styles.countText}>{job.photos}</Text>
          </View>
          <View style={styles.countChip}>
            <Icon name="mic" size={12} color={colors.mute} />
            <Text style={styles.countText}>{job.clips}</Text>
          </View>
        </View>
      </View>
      <PhotoBox seed={job.id} style={styles.fullPhoto} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  compactCard: {
    flexDirection: 'row',
    gap: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
  },
  compactPhoto: { borderRadius: 8 },
  compactBody: { flex: 1, minWidth: 0 },
  compactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  compactId: {
    fontFamily: fonts.mono,
    fontSize: 10.5,
    color: colors.mute,
  },
  compactStatus: { marginLeft: 'auto' },
  compactMachine: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 13,
    color: colors.text,
    letterSpacing: -0.15,
    lineHeight: 16,
  },
  compactIdle: {
    fontFamily: fonts.sans,
    fontSize: 11,
    color: colors.mute,
    marginTop: 1,
  },
  horizontalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radii.xl,
    backgroundColor: colors.surface,
  },
  timePill: {
    width: 46,
    height: 46,
    borderRadius: 10,
    backgroundColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeText: {
    color: '#fff',
    fontFamily: fonts.sansSemiBold,
    fontSize: 12.5,
  },
  horizontalBody: { flex: 1, minWidth: 0 },
  horizontalMachine: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 14,
    color: colors.text,
    letterSpacing: -0.2,
  },
  horizontalMeta: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.mute,
    marginTop: 2,
  },
  fullCard: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radii.xl,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  fullBody: { flex: 1, padding: 14, minWidth: 0 },
  fullHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  fullId: {
    fontFamily: fonts.sansBold,
    fontSize: 11,
    color: colors.mute,
    letterSpacing: 0.3,
  },
  spacer: { flex: 1 },
  fullMachine: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 14.5,
    color: colors.text,
    letterSpacing: -0.2,
  },
  fullMeta: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.mute,
    marginTop: 2,
  },
  fullRoot: {
    fontFamily: fonts.sans,
    fontSize: 12.5,
    color: colors.textDim,
    marginTop: 8,
    lineHeight: 18,
  },
  fullFooter: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  countChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  countText: {
    fontFamily: fonts.sans,
    fontSize: 11,
    color: colors.mute,
  },
  fullPhoto: {
    width: 96,
    height: 'auto',
    borderRadius: 0,
  },
});
