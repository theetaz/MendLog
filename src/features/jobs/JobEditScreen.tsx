import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { Image } from 'expo-image';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  DateTimeField,
  NumberWithUnit,
  PhotoGrid,
  SearchSelect,
  type SelectOption,
  type StagedPhoto,
  TextField,
  type TimeUnit,
  VoiceTextArea,
  toMinutes,
} from '../../components/form';
import { AppBar, Btn, Icon, SectionLabel } from '../../design/components';
import { fonts, radii, spacing, type ThemeColors, useColors } from '../../design/tokens';
import type { Job, JobStatus } from '../../types/job';
import { STATUS_OPTIONS, statusOption } from './statusOptions';
import { useCatalog } from '../catalog/useCatalog';
import type { ClipRow } from './clipsApi';
import {
  type ClipWithUrl,
  type PhotoWithUrl,
  deleteClip,
  deleteJob,
  deletePhoto,
  fetchJobDetail,
  linkClipToJob,
  updateJob,
} from './jobsApi';
import { invokeAnnotatePhoto, uploadAndInsertPhoto } from './photosApi';
import { useVoiceNoteRecorder } from './useVoiceNoteRecorder';

interface JobEditScreenProps {
  jobId: number;
  userId: string;
  onClose(): void;
  onSaved?(jobId: number): void;
  onDeleted?(jobId: number): void;
}

interface FormState {
  department: SelectOption | null;
  machine: SelectOption | null;
  inv: string;
  reportedAt: Date | null;
  description: string;
  rootCause: string;
  correctiveAction: string;
  remarks: string;
  completedAt: Date | null;
  idleValue: number;
  idleUnit: TimeUnit;
  status: SelectOption;
}

interface FormErrors {
  department?: string;
  machine?: string;
  inv?: string;
  reportedAt?: string;
  description?: string;
}

function combineDateAndTime(date: string, time: string): Date {
  const [y, mo, d] = date.split('-').map(Number);
  const [h, mi] = time.split(':').map(Number);
  return new Date(y, (mo ?? 1) - 1, d ?? 1, h ?? 0, mi ?? 0, 0);
}

function jobToForm(
  job: Job,
  departments: SelectOption[],
  machines: SelectOption[],
): FormState {
  const dept = departments.find((d) => d.label === job.dept) ?? null;
  const machine = machines.find((m) => m.label === job.machine) ?? null;
  return {
    department: dept,
    machine,
    inv: job.inv ?? '',
    reportedAt: combineDateAndTime(job.date, job.time),
    description: job.desc,
    rootCause: job.rootCause,
    correctiveAction: job.action,
    remarks: job.remarks,
    completedAt: job.completedAt ? new Date(job.completedAt) : null,
    idleValue: job.idleMinutes,
    idleUnit: 'minutes',
    status: statusOption(job.status),
  };
}

export function JobEditScreen({
  jobId,
  userId,
  onClose,
  onSaved,
  onDeleted,
}: JobEditScreenProps) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const catalog = useCatalog();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Media state
  const [existingPhotos, setExistingPhotos] = useState<PhotoWithUrl[]>([]);
  const [removedPhotoIds, setRemovedPhotoIds] = useState<Set<number>>(new Set());
  const [newPhotos, setNewPhotos] = useState<StagedPhoto[]>([]);

  const [existingClips, setExistingClips] = useState<ClipWithUrl[]>([]);
  const [removedClipIds, setRemovedClipIds] = useState<Set<number>>(new Set());
  const [newClipIds, setNewClipIds] = useState<number[]>([]);
  const [newClips, setNewClips] = useState<ClipRow[]>([]);

  const voice = useVoiceNoteRecorder({
    userId,
    onTranscribed: (clip) => {
      setNewClipIds((ids) => [...ids, clip.id]);
      setNewClips((clips) => [...clips, clip]);
    },
  });

  const departmentOptions = useMemo<SelectOption[]>(
    () => catalog.departments.map((d) => ({ id: d.id, label: d.name })),
    [catalog.departments],
  );

  const allMachineOptions = useMemo<SelectOption[]>(
    () => catalog.machines.map((m) => ({ id: m.id, label: m.name })),
    [catalog.machines],
  );

  const machineOptionsForDept = useMemo<SelectOption[]>(() => {
    if (!form?.department) return [];
    const list = catalog.machinesByDept.get(Number(form.department.id)) ?? [];
    return list.map((m) => ({ id: m.id, label: m.name }));
  }, [catalog.machinesByDept, form?.department]);

  useEffect(() => {
    if (catalog.loading) return;
    let cancelled = false;
    (async () => {
      try {
        const detail = await fetchJobDetail(jobId);
        if (cancelled) return;
        if (!detail) {
          setLoadError('Job not found');
          return;
        }
        setForm(jobToForm(detail.job, departmentOptions, allMachineOptions));
        setExistingPhotos(detail.photos);
        setExistingClips(detail.clips);
      } catch (e) {
        if (cancelled) return;
        setLoadError(e instanceof Error ? e.message : 'Failed to load');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [jobId, catalog.loading, allMachineOptions, departmentOptions]);

  const update = useCallback(<K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((s) => (s ? { ...s, [key]: value } : s));
    setErrors((e) => ({ ...e, [key]: undefined }));
  }, []);

  const togglePhotoRemoval = useCallback((photoId: number) => {
    setRemovedPhotoIds((prev) => {
      const next = new Set(prev);
      if (next.has(photoId)) next.delete(photoId);
      else next.add(photoId);
      return next;
    });
  }, []);

  const toggleClipRemoval = useCallback((clipId: number) => {
    setRemovedClipIds((prev) => {
      const next = new Set(prev);
      if (next.has(clipId)) next.delete(clipId);
      else next.add(clipId);
      return next;
    });
  }, []);

  const validate = useCallback((): boolean => {
    if (!form) return false;
    const next: FormErrors = {};
    if (!form.department) next.department = 'Required';
    if (!form.machine) next.machine = 'Required';
    if (!form.inv.trim()) next.inv = 'Required';
    if (!form.reportedAt) next.reportedAt = 'Required';
    if (!form.description.trim()) next.description = 'Required';
    setErrors(next);
    return Object.keys(next).length === 0;
  }, [form]);

  const handleSave = useCallback(async () => {
    if (!validate() || !form || !form.reportedAt || !form.department || !form.machine) return;
    setSaving(true);
    setSaveError(null);
    try {
      await updateJob(jobId, {
        machine: form.machine.label,
        dept: form.department.label,
        inv: form.inv,
        reportedAt: form.reportedAt,
        description: form.description,
        rootCause: form.rootCause,
        correctiveAction: form.correctiveAction,
        remarks: form.remarks,
        completedAt: form.completedAt,
        idleMinutes: toMinutes(form.idleValue, form.idleUnit),
        status: form.status.id as JobStatus,
      });

      for (const photoId of removedPhotoIds) {
        const photo = existingPhotos.find((p) => p.id === photoId);
        if (photo) {
          await deletePhoto(photoId, photo.storage_path).catch((e) =>
            console.warn('delete photo:', e),
          );
        }
      }

      for (const clipId of removedClipIds) {
        const clip = existingClips.find((c) => c.id === clipId);
        if (clip) {
          await deleteClip(clipId, clip.audio_path).catch((e) =>
            console.warn('delete clip:', e),
          );
        }
      }

      for (const photo of newPhotos) {
        try {
          const row = await uploadAndInsertPhoto({ userId, jobId, photo });
          invokeAnnotatePhoto(row.id).catch((e) => console.warn('annotate:', e));
        } catch (e) {
          console.warn('photo upload:', e);
        }
      }

      for (const clipId of newClipIds) {
        await linkClipToJob(clipId, jobId).catch((e) =>
          console.warn('link clip:', e),
        );
      }

      onSaved?.(jobId);
      onClose();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }, [
    existingClips,
    existingPhotos,
    form,
    jobId,
    newClipIds,
    newPhotos,
    onClose,
    onSaved,
    removedClipIds,
    removedPhotoIds,
    userId,
    validate,
  ]);

  const handleDelete = useCallback(() => {
    Alert.alert(
      'Delete this job?',
      'This removes the job, its photos and voice notes permanently.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await deleteJob(jobId);
              onDeleted?.(jobId);
              onClose();
            } catch (e) {
              setSaveError(e instanceof Error ? e.message : 'Delete failed');
            } finally {
              setDeleting(false);
            }
          },
        },
      ],
    );
  }, [jobId, onClose, onDeleted]);

  const handleCancel = useCallback(() => {
    Alert.alert('Discard changes?', 'Your edits will be lost.', [
      { text: 'Keep editing', style: 'cancel' },
      { text: 'Discard', style: 'destructive', onPress: onClose },
    ]);
  }, [onClose]);

  if (loading || catalog.loading) {
    return <LoadingShell jobId={jobId} onClose={onClose} styles={styles} colors={colors} />;
  }

  if (loadError || !form) {
    return (
      <ErrorShell
        message={loadError ?? 'Could not load job'}
        onClose={onClose}
        styles={styles}
        colors={colors}
      />
    );
  }

  const busy = saving || deleting;

  return (
    <View style={styles.container}>
      <AppBar
        title={`Edit job #${jobId}`}
        left={
          <Pressable onPress={handleCancel} hitSlop={10}>
            <Icon name="x" size={22} color={colors.text} weight={2} />
          </Pressable>
        }
      />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingBottom: insets.bottom + spacing.xxl },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <SectionLabel>Job details</SectionLabel>

          <SearchSelect
            label="Department"
            required
            value={form.department}
            options={departmentOptions}
            onChange={(next) => {
              setForm((s) => (s ? { ...s, department: next, machine: null } : s));
              setErrors((e) => ({ ...e, department: undefined, machine: undefined }));
            }}
            error={errors.department}
            placeholder="Select a department"
            searchPlaceholder="Search departments"
          />

          <SearchSelect
            label="Machine"
            required
            value={form.machine}
            options={machineOptionsForDept}
            onChange={(next) => update('machine', next)}
            error={errors.machine}
            disabled={!form.department}
            disabledHint="Pick a department first"
            placeholder="Select a machine"
            searchPlaceholder="Search machines"
          />

          <TextField
            label="Inventory number"
            required
            value={form.inv}
            onChangeText={(v) => update('inv', v)}
            error={errors.inv}
            placeholder="e.g. INV-0421"
            autoCapitalize="characters"
            autoCorrect={false}
          />

          <DateTimeField
            label="Date & time reported"
            required
            value={form.reportedAt}
            onChange={(v) => update('reportedAt', v)}
            error={errors.reportedAt}
          />

          <SectionLabel>Failure & fix</SectionLabel>

          <VoiceTextArea
            label="Description of failure"
            required
            value={form.description}
            onChangeText={(v) => update('description', v)}
            error={errors.description}
            placeholder="What happened? Tap the mic to dictate."
            minHeight={110}
          />

          <VoiceTextArea
            label="Root cause"
            value={form.rootCause}
            onChangeText={(v) => update('rootCause', v)}
            placeholder="Why did it fail?"
          />

          <VoiceTextArea
            label="Corrective action"
            value={form.correctiveAction}
            onChangeText={(v) => update('correctiveAction', v)}
            placeholder="What was done to fix it?"
          />

          <VoiceTextArea
            label="Remarks"
            value={form.remarks}
            onChangeText={(v) => update('remarks', v)}
            placeholder="Anything else worth noting?"
          />

          <SectionLabel>Timing</SectionLabel>

          <DateTimeField
            label="Date & time of completion"
            optional
            value={form.completedAt}
            onChange={(v) => update('completedAt', v)}
          />

          <NumberWithUnit
            label="Total idle time"
            value={form.idleValue}
            unit={form.idleUnit}
            onChange={({ value, unit }) => {
              setForm((s) => (s ? { ...s, idleValue: value, idleUnit: unit } : s));
            }}
          />

          <SearchSelect
            label="Status"
            required
            value={form.status}
            options={STATUS_OPTIONS}
            onChange={(next) => {
              if (!next) return;
              setForm((s) => (s ? { ...s, status: next } : s));
            }}
            placeholder="Select status"
            searchPlaceholder="Search status"
          />

          <SectionLabel>Photos</SectionLabel>
          <ExistingPhotosEditor
            photos={existingPhotos}
            removed={removedPhotoIds}
            onToggleRemove={togglePhotoRemoval}
            styles={styles}
          />
          <PhotoGrid
            label="Add new photos"
            photos={newPhotos}
            onChange={setNewPhotos}
            max={10}
          />

          <SectionLabel>Voice notes</SectionLabel>
          <ExistingClipsEditor
            clips={existingClips}
            removed={removedClipIds}
            onToggleRemove={toggleClipRemoval}
            styles={styles}
            colors={colors}
          />
          {newClips.length > 0 && (
            <View style={styles.newClipsList}>
              {newClips.map((clip) => (
                <View key={clip.id} style={styles.newClipBadge}>
                  <Icon name="check" size={14} color={colors.emerald} weight={2} />
                  <Text style={styles.newClipText} numberOfLines={2}>
                    New · {clip.transcript_en_clean ?? 'Transcribing…'}
                  </Text>
                </View>
              ))}
            </View>
          )}
          <VoiceNoteAddPill voice={voice} styles={styles} colors={colors} />

          {saveError && (
            <View style={styles.errorCard}>
              <Icon name="warning" size={16} color={colors.red} weight={2} />
              <Text style={styles.errorCardText}>{saveError}</Text>
            </View>
          )}

          <Btn
            kind="primary"
            size="lg"
            block
            onPress={handleSave}
            disabled={busy}
            testID="job-edit-save"
          >
            {saving ? 'Saving…' : 'Save changes'}
          </Btn>

          <Pressable
            onPress={handleDelete}
            disabled={busy}
            style={({ pressed }) => [
              styles.deleteBtn,
              pressed && styles.pressed,
              busy && styles.btnDisabled,
            ]}
            testID="job-edit-delete"
          >
            <Icon name="trash" size={16} color={colors.red} weight={2} />
            <Text style={styles.deleteBtnText}>
              {deleting ? 'Deleting…' : 'Delete job'}
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function LoadingShell({ jobId, onClose, styles, colors }: { jobId: number; onClose(): void; styles: ReturnType<typeof makeStyles>; colors: ThemeColors }) {
  return (
    <View style={styles.container}>
      <AppBar
        title={`Edit job #${jobId}`}
        left={
          <Pressable onPress={onClose} hitSlop={10}>
            <Icon name="x" size={22} color={colors.text} weight={2} />
          </Pressable>
        }
      />
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.navy} />
      </View>
    </View>
  );
}

function ErrorShell({ message, onClose, styles, colors }: { message: string; onClose(): void; styles: ReturnType<typeof makeStyles>; colors: ThemeColors }) {
  return (
    <View style={styles.container}>
      <AppBar
        title="Edit job"
        left={
          <Pressable onPress={onClose} hitSlop={10}>
            <Icon name="x" size={22} color={colors.text} weight={2} />
          </Pressable>
        }
      />
      <View style={styles.center}>
        <Icon name="warning" size={28} color={colors.red} weight={2} />
        <Text style={styles.errorText}>{message}</Text>
      </View>
    </View>
  );
}

function ExistingPhotosEditor({
  photos,
  removed,
  onToggleRemove,
  styles,
}: {
  photos: PhotoWithUrl[];
  removed: Set<number>;
  onToggleRemove(id: number): void;
  styles: ReturnType<typeof makeStyles>;
}) {
  const colors = useColors();
  if (photos.length === 0) {
    return (
      <View style={styles.emptyMediaCard}>
        <Text style={styles.emptyMediaText}>No photos attached yet.</Text>
      </View>
    );
  }
  return (
    <View style={styles.existingPhotosGrid}>
      {photos.map((photo) => {
        const isRemoved = removed.has(photo.id);
        return (
          <View key={photo.id} style={styles.existingPhotoTile}>
            {photo.signed_url ? (
              <Image
                source={{ uri: photo.signed_url }}
                placeholder={photo.blurhash ? { blurhash: photo.blurhash } : undefined}
                transition={200}
                contentFit="cover"
                style={[styles.existingPhotoImg, isRemoved && styles.mediaDim]}
              />
            ) : (
              <View style={[styles.existingPhotoImg, styles.photoMissing]}>
                <Icon name="photo" size={22} color={colors.mute} weight={1.5} />
              </View>
            )}
            <Pressable
              onPress={() => onToggleRemove(photo.id)}
              hitSlop={6}
              style={[styles.removeOverlay, isRemoved && styles.removeOverlayActive]}
            >
              <Icon
                name={isRemoved ? 'refresh' : 'x'}
                size={12}
                color="#fff"
                weight={2.5}
              />
            </Pressable>
            {isRemoved && (
              <View style={styles.removedPill}>
                <Text style={styles.removedPillText}>Will delete</Text>
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}

function ExistingClipsEditor({
  clips,
  removed,
  onToggleRemove,
  styles,
  colors,
}: {
  clips: ClipWithUrl[];
  removed: Set<number>;
  onToggleRemove(id: number): void;
  styles: ReturnType<typeof makeStyles>;
  colors: ThemeColors;
}) {
  if (clips.length === 0) {
    return (
      <View style={styles.emptyMediaCard}>
        <Text style={styles.emptyMediaText}>No voice notes attached yet.</Text>
      </View>
    );
  }
  return (
    <View style={styles.clipsList}>
      {clips.map((clip) => (
        <ClipEditCard
          key={clip.id}
          clip={clip}
          removed={removed.has(clip.id)}
          onToggleRemove={() => onToggleRemove(clip.id)}
          styles={styles}
          colors={colors}
        />
      ))}
    </View>
  );
}

function ClipEditCard({
  clip,
  removed,
  onToggleRemove,
  styles,
  colors,
}: {
  clip: ClipWithUrl;
  removed: boolean;
  onToggleRemove(): void;
  styles: ReturnType<typeof makeStyles>;
  colors: ThemeColors;
}) {
  const player = useAudioPlayer(clip.signed_url ?? undefined, { updateInterval: 500 });
  const status = useAudioPlayerStatus(player);

  const toggle = () => {
    if (!clip.signed_url) return;
    if (status.playing) player.pause();
    else {
      if (status.currentTime >= (status.duration || 0) - 0.1) player.seekTo(0);
      player.play();
    }
  };

  const totalSec = Math.max(status.duration || 0, clip.duration_ms / 1000);
  const display = clip.transcript_en_clean ?? clip.transcript_clean ?? '';

  return (
    <View style={[styles.clipCard, removed && styles.mediaDim]}>
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
          size={16}
          color={status.playing ? '#fff' : colors.navy}
          weight={2}
        />
      </Pressable>
      <View style={styles.clipBody}>
        <Text style={styles.clipDuration}>{formatSeconds(totalSec)}</Text>
        {!!display && (
          <Text style={styles.clipPreview} numberOfLines={2}>
            {display}
          </Text>
        )}
        {removed && <Text style={styles.clipRemovedTag}>Will delete</Text>}
      </View>
      <Pressable onPress={onToggleRemove} hitSlop={8} style={styles.clipRemoveBtn}>
        <Icon name={removed ? 'refresh' : 'trash'} size={14} color={colors.mute} weight={2} />
      </Pressable>
    </View>
  );
}

interface VoiceAddProps {
  voice: ReturnType<typeof useVoiceNoteRecorder>;
}

function VoiceNoteAddPill({
  voice,
  styles,
  colors,
}: VoiceAddProps & { styles: ReturnType<typeof makeStyles>; colors: ThemeColors }) {
  const seconds = Math.floor(voice.elapsedMs / 1000);
  const dur = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(
    seconds % 60,
  ).padStart(2, '0')}`;

  if (voice.stage === 'idle' || voice.stage === 'done') {
    return (
      <Pressable
        onPress={voice.stage === 'done' ? voice.reset : voice.start}
        style={({ pressed }) => [styles.addPill, pressed && styles.pressed]}
      >
        <Icon name="mic" size={16} color={colors.navy} weight={2} />
        <Text style={styles.addPillText}>
          {voice.stage === 'done' ? 'Record another voice note' : 'Record a voice note'}
        </Text>
      </Pressable>
    );
  }
  if (voice.stage === 'recording') {
    return (
      <Pressable
        onPress={voice.stop}
        style={({ pressed }) => [styles.addPillActive, pressed && styles.pressed]}
      >
        <View style={styles.liveDot} />
        <Text style={styles.addPillActiveText}>Recording · {dur}</Text>
        <View style={styles.stopSquareSmall} />
      </Pressable>
    );
  }
  if (voice.stage === 'error') {
    return (
      <View style={styles.errorCard}>
        <Icon name="warning" size={14} color={colors.red} weight={2} />
        <Text style={styles.errorCardText}>{voice.error ?? 'Recording failed'}</Text>
        <Pressable onPress={voice.reset} hitSlop={8}>
          <Text style={styles.retryLink}>Retry</Text>
        </Pressable>
      </View>
    );
  }
  return (
    <View style={styles.busyPill}>
      <ActivityIndicator size="small" color={colors.navy} />
      <Text style={styles.busyPillText}>
        {voice.stage === 'uploading' ? 'Uploading…' : 'Transcribing…'}
      </Text>
    </View>
  );
}

function formatSeconds(s: number): string {
  const total = Math.max(0, Math.floor(s));
  const mm = Math.floor(total / 60);
  const ss = total % 60;
  return `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  scroll: {
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: spacing.xl,
  },
  errorText: {
    fontFamily: fonts.sans,
    fontSize: 14,
    color: colors.red,
    textAlign: 'center',
  },
  pressed: { opacity: 0.85 },

  emptyMediaCard: {
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.lineSoft,
    backgroundColor: colors.surface,
  },
  emptyMediaText: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.mute,
  },

  existingPhotosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  existingPhotoTile: {
    width: 92,
    height: 92,
    borderRadius: radii.md,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: colors.line,
  },
  existingPhotoImg: { width: '100%', height: '100%' },
  photoMissing: { alignItems: 'center', justifyContent: 'center' },
  removeOverlay: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeOverlayActive: { backgroundColor: colors.navy },
  removedPill: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radii.pill,
    backgroundColor: colors.red,
  },
  removedPillText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 9,
    color: '#fff',
    letterSpacing: 0.3,
  },
  mediaDim: { opacity: 0.55 },

  clipsList: { gap: spacing.sm },
  clipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm + 2,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  playBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
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
  clipBody: { flex: 1, gap: 2 },
  clipDuration: {
    fontFamily: fonts.mono,
    fontSize: 12,
    color: colors.muteDeep,
  },
  clipPreview: {
    fontFamily: fonts.sans,
    fontSize: 13,
    lineHeight: 18,
    color: colors.text,
  },
  clipRemovedTag: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 10.5,
    color: colors.red,
    letterSpacing: 0.3,
  },
  clipRemoveBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },

  newClipsList: { gap: spacing.sm },
  newClipBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm + 2,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.emeraldSoft,
    backgroundColor: colors.emeraldSoft,
  },
  newClipText: {
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.emerald,
  },

  addPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    borderStyle: 'dashed',
    backgroundColor: colors.surface,
  },
  addPillText: {
    flex: 1,
    fontFamily: fonts.sansSemiBold,
    fontSize: 13,
    color: colors.navy,
  },
  addPillActive: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.red,
    backgroundColor: colors.redSoft,
  },
  addPillActiveText: {
    flex: 1,
    fontFamily: fonts.mono,
    fontSize: 13,
    color: colors.red,
  },
  liveDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.red,
  },
  stopSquareSmall: {
    width: 12,
    height: 12,
    borderRadius: 2,
    backgroundColor: colors.red,
  },
  busyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  busyPillText: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.muteDeep,
  },
  retryLink: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 12,
    color: colors.red,
    textDecorationLine: 'underline',
  },

  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.red,
    backgroundColor: colors.redSoft,
  },
  errorCardText: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.red,
    flex: 1,
  },

  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.red,
    backgroundColor: colors.redSoft,
    marginTop: spacing.sm,
  },
  deleteBtnText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 14,
    color: colors.red,
    letterSpacing: 0.2,
  },
  btnDisabled: { opacity: 0.5 },
});
