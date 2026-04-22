import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { Image } from 'expo-image';
import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppBar, Btn, Icon, LangBadge, Pill, SectionLabel } from '../../design/components';
import { fonts, radii, spacing, type ThemeColors, useColors } from '../../design/tokens';
import { formatIdle } from '../../utils/idle';
import { statusTone } from '../../components/jobStatus';
import type { ClipWithUrl, JobDetail, PhotoWithUrl } from './jobsApi';
import { fetchJobDetail } from './jobsApi';
import { generateAndShareReport } from './reportPdf';

interface JobDetailScreenProps {
  jobId: string;
  onBack(): void;
  onEdit?(jobId: string): void;
}

export function JobDetailScreen({ jobId, onBack, onEdit }: JobDetailScreenProps) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const [detail, setDetail] = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  const handleDownload = useCallback(async () => {
    if (!detail || downloading) return;
    setDownloading(true);
    try {
      await generateAndShareReport(detail);
    } catch (e) {
      Alert.alert(
        'Could not generate report',
        e instanceof Error ? e.message : 'Unknown error',
      );
    } finally {
      setDownloading(false);
    }
  }, [detail, downloading]);

  const load = useCallback(async (): Promise<void> => {
    try {
      const result = await fetchJobDetail(jobId);
      setDetail(result);
      setError(result ? null : 'Job not found');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load job');
    }
  }, [jobId]);

  // Refetch whenever the screen regains focus (e.g. returning from Edit)
  // so text edits / added media show up without needing a cold start.
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        try {
          await load();
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();
      return () => {
        cancelled = true;
      };
    }, [load]),
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  return (
    <View style={styles.container}>
      <AppBar
        title={detail?.job ? `Job #${detail.job.id}` : 'Job'}
        left={
          <Pressable onPress={onBack} hitSlop={10}>
            <Icon name="x" size={22} color={colors.text} weight={2} />
          </Pressable>
        }
      />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.navy} />
        </View>
      ) : error || !detail ? (
        <View style={styles.center}>
          <Icon name="warning" size={32} color={colors.red} weight={2} />
          <Text style={styles.errorText}>{error ?? 'Job not found'}</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingBottom: insets.bottom + spacing.xxl },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.navy}
            />
          }
        >
          <JobHeader detail={detail} styles={styles} />

          {detail.photos.length > 0 && (
            <>
              <SectionLabel>{`Photos · ${detail.photos.length}`}</SectionLabel>
              <PhotoCarousel photos={detail.photos} styles={styles} colors={colors} />
            </>
          )}

          {detail.clips.length > 0 && (
            <>
              <SectionLabel>{`Voice clips · ${detail.clips.length}`}</SectionLabel>
              <View style={styles.clipsList}>
                {detail.clips.map((clip) => (
                  <ClipRow key={clip.id} clip={clip} styles={styles} colors={colors} />
                ))}
              </View>
            </>
          )}

          <SectionLabel>Details</SectionLabel>
          <FieldGroup
            fields={[
              { label: 'Department', value: detail.job.dept },
              { label: 'Machine', value: detail.job.machine },
              { label: 'Inventory', value: detail.job.inv || '—' },
              { label: 'Reported', value: `${formatDate(detail.job.date)} · ${detail.job.time}` },
              {
                label: 'Completed',
                value: detail.job.completedAt ? formatDateTime(detail.job.completedAt) : '—',
              },
              { label: 'Idle time', value: formatIdle(detail.job.idleMinutes) },
            ]}
            styles={styles}
          />

          <SectionLabel>Failure & fix</SectionLabel>
          <LongField label="Description of failure" value={detail.job.desc} styles={styles} />
          <LongField label="Root cause" value={detail.job.rootCause} styles={styles} />
          <LongField label="Corrective action" value={detail.job.action} styles={styles} />
          <LongField label="Remarks" value={detail.job.remarks} styles={styles} />

          <Btn
            kind="primary"
            size="lg"
            block
            onPress={handleDownload}
            disabled={downloading}
            testID="job-detail-download"
          >
            {downloading ? 'Preparing report…' : 'Download report'}
          </Btn>

          {onEdit && (
            <Btn
              kind="ghost"
              size="lg"
              block
              onPress={() => onEdit(detail.job.id)}
              testID="job-detail-edit"
            >
              Edit job
            </Btn>
          )}
        </ScrollView>
      )}
    </View>
  );
}

function JobHeader({ detail, styles }: { detail: JobDetail; styles: ReturnType<typeof makeStyles> }) {
  const tone = statusTone(detail.job.status);
  return (
    <View style={styles.headerBlock}>
      <View style={styles.headerRow}>
        <Pill bg={tone.bg} color={tone.fg}>
          {tone.label}
        </Pill>
        <LangBadge lang={detail.job.lang} />
        <View style={styles.spacer} />
        <Text style={styles.headerId}>#{detail.job.id}</Text>
      </View>
      <Text style={styles.headerMachine}>{detail.job.machine}</Text>
      <Text style={styles.headerMeta}>
        {detail.job.dept} · {formatDate(detail.job.date)} · {detail.job.time}
      </Text>
    </View>
  );
}

function PhotoCarousel({ photos, styles, colors }: { photos: PhotoWithUrl[]; styles: ReturnType<typeof makeStyles>; colors: ThemeColors }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.carousel}
    >
      {photos.map((photo) => (
        <View key={photo.id} style={styles.photoCell}>
          {photo.signed_url ? (
            <Image
              source={{ uri: photo.signed_url }}
              placeholder={photo.blurhash ? { blurhash: photo.blurhash } : undefined}
              transition={250}
              contentFit="cover"
              style={styles.photoImg}
            />
          ) : (
            <View style={[styles.photoImg, styles.photoMissing]}>
              <Icon name="photo" size={28} color={colors.mute} weight={1.5} />
            </View>
          )}
          {photo.ai_description && (
            <Text style={styles.photoCaption} numberOfLines={3}>
              {photo.ai_description}
            </Text>
          )}
          {photo.ai_tags && photo.ai_tags.length > 0 && (
            <View style={styles.tagsRow}>
              {photo.ai_tags.slice(0, 4).map((tag) => (
                <View key={tag} style={styles.tagChip}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      ))}
    </ScrollView>
  );
}

function ClipRow({ clip, styles, colors }: { clip: ClipWithUrl; styles: ReturnType<typeof makeStyles>; colors: ThemeColors }) {
  const player = useAudioPlayer(clip.signed_url ?? undefined, { updateInterval: 250 });
  const status = useAudioPlayerStatus(player);
  const [mode, setMode] = useState<'native' | 'english'>('english');

  const toggle = () => {
    if (!clip.signed_url) return;
    if (status.playing) player.pause();
    else {
      if (status.currentTime >= (status.duration || 0) - 0.1) player.seekTo(0);
      player.play();
    }
  };

  const transcriptNative = clip.transcript_clean ?? clip.transcript_raw ?? '';
  const transcriptEn = clip.transcript_en_clean ?? clip.transcript_en_raw ?? '';
  const hasBoth = !!transcriptNative && !!transcriptEn && transcriptNative !== transcriptEn;
  const shown = mode === 'native' ? transcriptNative : transcriptEn;

  return (
    <View style={styles.clipCard}>
      <View style={styles.clipRow}>
        <Pressable
          onPress={toggle}
          disabled={!clip.signed_url}
          style={({ pressed }) => [
            styles.playBtn,
            status.playing && styles.playBtnActive,
            pressed && styles.pressed,
          ]}
        >
          <Icon
            name={status.playing ? 'pause' : 'play'}
            size={18}
            color={status.playing ? '#fff' : colors.navy}
            weight={2}
          />
        </Pressable>
        <View style={styles.clipMeta}>
          <Text style={styles.clipTime}>
            {formatSeconds(status.currentTime)} / {formatSeconds(status.duration || clip.duration_ms / 1000)}
          </Text>
          <View style={styles.clipTrack}>
            <View
              style={[
                styles.clipTrackFill,
                { width: `${trackProgress(status.currentTime, status.duration)}%` },
              ]}
            />
          </View>
        </View>
      </View>

      {hasBoth && (
        <View style={styles.clipTabs}>
          <Pressable onPress={() => setMode('english')} hitSlop={6}>
            <Text style={[styles.clipTab, mode === 'english' && styles.clipTabActive]}>English</Text>
          </Pressable>
          <Pressable onPress={() => setMode('native')} hitSlop={6}>
            <Text style={[styles.clipTab, mode === 'native' && styles.clipTabActive]}>Native</Text>
          </Pressable>
        </View>
      )}

      {!!shown && <Text style={styles.clipTranscript}>{shown}</Text>}
    </View>
  );
}

function FieldGroup({ fields, styles }: { fields: { label: string; value: string }[]; styles: ReturnType<typeof makeStyles> }) {
  return (
    <View style={styles.fieldGroup}>
      {fields.map((f, i) => (
        <View
          key={f.label}
          style={[styles.fieldRow, i < fields.length - 1 && styles.fieldRowBorder]}
        >
          <Text style={styles.fieldLabel}>{f.label}</Text>
          <Text style={styles.fieldValue}>{f.value}</Text>
        </View>
      ))}
    </View>
  );
}

function LongField({ label, value, styles }: { label: string; value: string; styles: ReturnType<typeof makeStyles> }) {
  return (
    <View style={styles.longFieldCard}>
      <Text style={styles.longFieldLabel}>{label}</Text>
      <Text style={styles.longFieldValue}>{value?.trim() || '—'}</Text>
    </View>
  );
}

function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatSeconds(s: number): string {
  const total = Math.max(0, Math.floor(s));
  const mm = Math.floor(total / 60);
  const ss = total % 60;
  return `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
}

function trackProgress(current: number, total: number | null | undefined): number {
  if (!total || total <= 0) return 0;
  return Math.max(0, Math.min(100, (current / total) * 100));
}

const PHOTO_SIZE = Math.min(Dimensions.get('window').width - spacing.xl * 2, 280);

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: {
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.xl,
  },
  errorText: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.red,
    textAlign: 'center',
  },
  pressed: { opacity: 0.85 },
  spacer: { flex: 1 },

  headerBlock: {
    gap: 6,
    paddingVertical: spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerId: {
    fontFamily: fonts.mono,
    fontSize: 12,
    color: colors.mute,
  },
  headerMachine: {
    fontFamily: fonts.sansBold,
    fontSize: 24,
    letterSpacing: -0.6,
    color: colors.text,
    marginTop: 2,
  },
  headerMeta: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.mute,
  },

  carousel: {
    gap: spacing.sm,
    paddingRight: spacing.xl,
  },
  photoCell: {
    width: PHOTO_SIZE,
    gap: 6,
  },
  photoImg: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE * 0.75,
    borderRadius: radii.md,
    backgroundColor: colors.line,
  },
  photoMissing: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoCaption: {
    fontFamily: fonts.sans,
    fontSize: 12,
    lineHeight: 17,
    color: colors.textDim,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  tagChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.pill,
    backgroundColor: colors.lineSoft,
  },
  tagText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 10.5,
    color: colors.muteDeep,
    letterSpacing: 0.3,
  },

  clipsList: { gap: spacing.sm },
  clipCard: {
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    gap: spacing.sm,
  },
  clipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  playBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playBtnActive: {
    backgroundColor: colors.navy,
    borderColor: colors.navy,
  },
  clipMeta: { flex: 1, gap: 6 },
  clipTime: {
    fontFamily: fonts.mono,
    fontSize: 12,
    color: colors.muteDeep,
  },
  clipTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.lineSoft,
    overflow: 'hidden',
  },
  clipTrackFill: {
    height: '100%',
    backgroundColor: colors.navy,
  },
  clipTabs: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  clipTab: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 11,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: colors.mute,
  },
  clipTabActive: {
    color: colors.navy,
  },
  clipTranscript: {
    fontFamily: fonts.sans,
    fontSize: 13,
    lineHeight: 19,
    color: colors.text,
  },

  fieldGroup: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    gap: spacing.md,
  },
  fieldRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.lineSoft,
  },
  fieldLabel: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 12,
    color: colors.muteDeep,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    width: 110,
  },
  fieldValue: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.text,
    textAlign: 'right',
  },

  longFieldCard: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    padding: spacing.md,
    gap: 4,
  },
  longFieldLabel: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 11,
    color: colors.muteDeep,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  longFieldValue: {
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 20,
    color: colors.text,
  },
});
