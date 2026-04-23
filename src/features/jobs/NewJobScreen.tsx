import {
  AudioQuality,
  IOSOutputFormat,
  type RecordingOptions,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { useCatalog } from '../catalog/useCatalog';
import { type ClipRow, createAndUploadClip } from './clipsApi';
import { saveJob } from './jobsApi';
import { DEFAULT_STATUS, STATUS_OPTIONS, statusOption } from './statusOptions';
import type { JobStatus } from '../../types/job';

const RECORDING_OPTIONS: RecordingOptions = {
  extension: '.m4a',
  sampleRate: 16000,
  numberOfChannels: 1,
  bitRate: 32000,
  android: { outputFormat: 'mpeg4', audioEncoder: 'aac' },
  ios: {
    outputFormat: IOSOutputFormat.MPEG4AAC,
    audioQuality: AudioQuality.HIGH,
    linearPCMBitDepth: 16,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
  },
  web: { mimeType: 'audio/webm', bitsPerSecond: 32000 },
};

type VoiceNoteStage = 'idle' | 'recording' | 'uploading' | 'processing' | 'done' | 'error';

interface NewJobScreenProps {
  userId: string;
  onClose(): void;
  onSaved?(jobId: string): void;
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
  photos: StagedPhoto[];
}

interface FormErrors {
  department?: string;
  machine?: string;
  inv?: string;
  reportedAt?: string;
  description?: string;
}

const emptyForm = (): FormState => ({
  department: null,
  machine: null,
  inv: '',
  reportedAt: new Date(),
  description: '',
  rootCause: '',
  correctiveAction: '',
  remarks: '',
  completedAt: null,
  idleValue: 0,
  idleUnit: 'minutes',
  status: statusOption(DEFAULT_STATUS),
  photos: [],
});

export function NewJobScreen({ userId, onClose, onSaved }: NewJobScreenProps) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const catalog = useCatalog();

  const [form, setForm] = useState<FormState>(() => emptyForm());
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Voice-note attachment state (the reference voice note at the top)
  const recorder = useAudioRecorder(RECORDING_OPTIONS);
  const recorderState = useAudioRecorderState(recorder, 250);
  const [noteStage, setNoteStage] = useState<VoiceNoteStage>('idle');
  const [noteClip, setNoteClip] = useState<ClipRow | null>(null);
  const [noteError, setNoteError] = useState<string | null>(null);
  const [noteElapsedMs, setNoteElapsedMs] = useState(0);
  const clipIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (noteStage !== 'recording') return;
    setNoteElapsedMs(recorderState.durationMillis ?? 0);
  }, [recorderState.durationMillis, noteStage]);

  const update = useCallback(<K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((s) => ({ ...s, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  }, []);

  const departmentOptions = useMemo<SelectOption[]>(
    () => catalog.departments.map((d) => ({ id: d.id, label: d.name })),
    [catalog.departments],
  );

  const machineOptions = useMemo<SelectOption[]>(() => {
    if (!form.department) return [];
    const list = catalog.machinesByDept.get(Number(form.department.id)) ?? [];
    return list.map((m) => ({ id: m.id, label: m.name }));
  }, [catalog.machinesByDept, form.department]);

  const startNote = useCallback(async () => {
    setNoteError(null);
    try {
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
      setNoteStage('recording');
    } catch (e) {
      setNoteError(e instanceof Error ? e.message : 'Could not start recording');
      setNoteStage('error');
    }
  }, [recorder]);

  const stopNote = useCallback(async () => {
    try {
      const durationMs = recorderState.durationMillis ?? noteElapsedMs;
      await recorder.stop();
      const uri = recorder.uri;
      if (!uri) throw new Error('no recording file produced');

      // Save clip locally. Upload + transcription are deferred to the sync
      // engine — the transcript will appear after the device is online and
      // the pull sync has caught up. No network calls happen here.
      setNoteStage('uploading');
      const row = await createAndUploadClip({ userId, localUri: uri, durationMs });
      clipIdsRef.current.add(row.id);
      setNoteClip(row);
      setNoteStage('done');
    } catch (e) {
      setNoteError(e instanceof Error ? e.message : 'Saving failed');
      setNoteStage('error');
    }
  }, [noteElapsedMs, recorder, recorderState.durationMillis, userId]);

  const resetNote = useCallback(() => {
    setNoteClip(null);
    setNoteError(null);
    setNoteElapsedMs(0);
    setNoteStage('idle');
  }, []);

  const validate = useCallback((): boolean => {
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
    if (!validate()) return;
    if (!form.reportedAt || !form.department || !form.machine) return;
    setSaving(true);
    setSaveError(null);
    try {
      const saved = await saveJob(userId, {
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
        clipIds: Array.from(clipIdsRef.current),
        photos: form.photos,
      });
      onSaved?.(saved.id);
      onClose();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }, [form, onClose, onSaved, userId, validate]);

  const handleCancel = useCallback(() => {
    const hasWork =
      form.department !== null ||
      form.machine !== null ||
      form.inv ||
      form.description ||
      form.rootCause ||
      form.correctiveAction ||
      form.remarks ||
      form.photos.length > 0 ||
      noteClip !== null;
    if (!hasWork) {
      onClose();
      return;
    }
    Alert.alert('Discard this job?', 'Your form data and recording will be lost.', [
      { text: 'Keep editing', style: 'cancel' },
      { text: 'Discard', style: 'destructive', onPress: onClose },
    ]);
  }, [form, noteClip, onClose]);

  return (
    <View style={styles.container}>
      <AppBar
        title="New job"
        left={
          <Pressable onPress={handleCancel} hitSlop={10} testID="new-job-close">
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
              setForm((s) => ({ ...s, department: next, machine: null }));
              setErrors((e) => ({ ...e, department: undefined, machine: undefined }));
            }}
            error={errors.department}
            placeholder={
              catalog.loading ? 'Loading…' : catalog.error ? 'Catalog failed to load' : 'Select a department'
            }
            searchPlaceholder="Search departments"
            emptyMessage="No departments match"
          />

          <SearchSelect
            label="Machine"
            required
            value={form.machine}
            options={machineOptions}
            onChange={(next) => {
              // Autofill the inventory number from the picked machine when it
              // has one on file. Users can still edit after, so we only fill
              // (not override) when the machine carries a value.
              const inv = next
                ? catalog.machines.find((m) => m.id === Number(next.id))?.inventory_number
                : null;
              setForm((s) => ({
                ...s,
                machine: next,
                inv: inv && inv.trim() ? inv : s.inv,
              }));
              setErrors((e) => ({ ...e, machine: undefined, inv: undefined }));
            }}
            error={errors.machine}
            disabled={!form.department}
            disabledHint="Pick a department first"
            placeholder="Select a machine"
            searchPlaceholder="Search machines"
            emptyMessage="No machines match"
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
              setForm((s) => ({ ...s, idleValue: value, idleUnit: unit }));
            }}
          />

          <SearchSelect
            label="Status"
            required
            value={form.status}
            options={STATUS_OPTIONS}
            onChange={(next) => next && update('status', next)}
            placeholder="Select status"
            searchPlaceholder="Search status"
          />

          <SectionLabel>Photos</SectionLabel>

          <PhotoGrid
            label="Attach photos"
            photos={form.photos}
            onChange={(next) => update('photos', next)}
            max={10}
          />

          <SectionLabel>Voice note · reference</SectionLabel>

          <VoiceNoteCompact
            stage={noteStage}
            elapsedMs={noteElapsedMs}
            clip={noteClip}
            errorText={noteError}
            onStart={startNote}
            onStop={stopNote}
            onReset={resetNote}
            styles={styles}
            colors={colors}
          />

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
            disabled={saving}
            testID="new-job-save"
          >
            {saving ? 'Saving…' : 'Save job'}
          </Btn>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

interface VoiceNoteCompactProps {
  stage: VoiceNoteStage;
  elapsedMs: number;
  clip: ClipRow | null;
  errorText: string | null;
  onStart(): void;
  onStop(): void;
  onReset(): void;
}

function VoiceNoteCompact({
  stage,
  elapsedMs,
  clip,
  errorText,
  onStart,
  onStop,
  onReset,
  styles,
  colors,
}: VoiceNoteCompactProps & { styles: ReturnType<typeof makeStyles>; colors: ThemeColors }) {
  const duration = formatDuration(
    stage === 'recording' ? elapsedMs : clip?.duration_ms ?? elapsedMs,
  );
  const busy = stage === 'uploading' || stage === 'processing';

  if (stage === 'idle') {
    return (
      <Pressable
        onPress={onStart}
        style={({ pressed }) => [styles.notePill, pressed && styles.pressed]}
        testID="new-job-record"
      >
        <View style={styles.notePillDot} />
        <Text style={styles.notePillText}>Attach voice note</Text>
        <Icon name="mic" size={16} color={colors.navy} weight={2} />
      </Pressable>
    );
  }

  if (stage === 'recording') {
    return (
      <Pressable
        onPress={onStop}
        style={({ pressed }) => [styles.notePillActive, pressed && styles.pressed]}
        testID="new-job-stop"
      >
        <View style={styles.liveDot} />
        <Text style={styles.notePillActiveText}>Recording · {duration}</Text>
        <View style={styles.stopSquareSmall} />
      </Pressable>
    );
  }

  if (busy) {
    return (
      <View style={styles.notePillBusy}>
        <ActivityIndicator size="small" color={colors.navy} />
        <Text style={styles.notePillText}>
          {stage === 'uploading' ? 'Uploading…' : 'Transcribing…'}
        </Text>
      </View>
    );
  }

  if (stage === 'done' && clip) {
    return (
      <View style={styles.noteDoneWrap}>
        <View style={styles.noteDoneRow}>
          <Icon name="check" size={14} color={colors.emerald} weight={2.5} />
          <Text style={styles.noteDoneText}>Voice note attached · {duration}</Text>
          <Pressable onPress={onReset} hitSlop={8} style={styles.reRecordBtn}>
            <Icon name="mic" size={12} color={colors.navy} weight={2} />
            <Text style={styles.reRecordText}>Re-record</Text>
          </Pressable>
        </View>
        {!!clip.transcript_en_clean && (
          <Text style={styles.noteTranscriptPreview} numberOfLines={2}>
            {clip.transcript_en_clean}
          </Text>
        )}
      </View>
    );
  }

  return (
    <View style={styles.errorCard}>
      <Icon name="warning" size={14} color={colors.red} weight={2} />
      <Text style={styles.errorCardText}>{errorText ?? 'Something went wrong'}</Text>
      <Pressable onPress={onReset} hitSlop={8} style={styles.reRecordBtn}>
        <Text style={styles.reRecordText}>Retry</Text>
      </Pressable>
    </View>
  );
}

function formatDuration(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
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
  pressed: { opacity: 0.85 },

  notePill: {
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
  notePillDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.red,
  },
  notePillText: {
    flex: 1,
    fontFamily: fonts.sansSemiBold,
    fontSize: 14,
    color: colors.text,
  },
  notePillActive: {
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
  liveDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.red,
  },
  notePillActiveText: {
    flex: 1,
    fontFamily: fonts.mono,
    fontSize: 14,
    color: colors.red,
  },
  stopSquareSmall: {
    width: 14,
    height: 14,
    borderRadius: 3,
    backgroundColor: colors.red,
  },
  notePillBusy: {
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
  noteDoneWrap: {
    gap: 6,
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.emeraldSoft,
    backgroundColor: colors.emeraldSoft,
  },
  noteDoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  noteDoneText: {
    flex: 1,
    fontFamily: fonts.sansSemiBold,
    fontSize: 13,
    color: colors.emerald,
  },
  reRecordBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  reRecordText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 11,
    color: colors.navy,
  },
  noteTranscriptPreview: {
    fontFamily: fonts.sans,
    fontSize: 13,
    lineHeight: 18,
    color: colors.text,
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
});
