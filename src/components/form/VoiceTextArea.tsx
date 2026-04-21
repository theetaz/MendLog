import {
  AudioQuality,
  IOSOutputFormat,
  type RecordingOptions,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Icon } from '../../design/components/Icon';
import { fonts, radii, spacing, type ThemeColors, useColors } from '../../design/tokens';
import { transcribeAudioOnce } from '../../features/jobs/clipsApi';

// Whisper-optimal + emulator-friendly
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

interface VoiceTextAreaProps {
  label: string;
  value: string;
  onChangeText(next: string): void;
  required?: boolean;
  placeholder?: string;
  error?: string | null;
  minHeight?: number;
}

type Stage = 'idle' | 'recording' | 'transcribing';

export function VoiceTextArea({
  label,
  value,
  onChangeText,
  required,
  placeholder,
  error,
  minHeight = 96,
}: VoiceTextAreaProps) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const recorder = useAudioRecorder(RECORDING_OPTIONS);
  const recorderState = useAudioRecorderState(recorder, 500);
  const [stage, setStage] = useState<Stage>('idle');
  const [micError, setMicError] = useState<string | null>(null);

  const startRecording = useCallback(async () => {
    setMicError(null);
    try {
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
      setStage('recording');
    } catch (e) {
      setMicError(e instanceof Error ? e.message : 'Could not start recording');
      setStage('idle');
    }
  }, [recorder]);

  const stopAndTranscribe = useCallback(async () => {
    setStage('transcribing');
    try {
      await recorder.stop();
      const uri = recorder.uri;
      if (!uri) throw new Error('no recording file');
      const text = await transcribeAudioOnce(uri);
      if (text) {
        const joiner = value && !value.endsWith(' ') && !value.endsWith('\n') ? ' ' : '';
        onChangeText(`${value}${joiner}${text}`);
      }
      setStage('idle');
    } catch (e) {
      setMicError(e instanceof Error ? e.message : 'Transcription failed');
      setStage('idle');
    }
  }, [onChangeText, recorder, value]);

  const handleMicPress = useCallback(() => {
    if (stage === 'idle') startRecording();
    else if (stage === 'recording') stopAndTranscribe();
  }, [stage, startRecording, stopAndTranscribe]);

  const secs = Math.floor((recorderState.durationMillis ?? 0) / 1000);

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
        {stage === 'recording' && (
          <View style={styles.recordingBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.recordingText}>
              Recording · {String(Math.floor(secs / 60)).padStart(2, '0')}:
              {String(secs % 60).padStart(2, '0')}
            </Text>
          </View>
        )}
        {stage === 'transcribing' && (
          <View style={styles.recordingBadge}>
            <ActivityIndicator size="small" color={colors.navy} />
            <Text style={styles.transcribingText}>Transcribing…</Text>
          </View>
        )}
      </View>

      <View style={[styles.inputWrap, !!error && styles.inputWrapError]}>
        <TextInput
          multiline
          editable={stage !== 'transcribing'}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.mute}
          style={[styles.input, { minHeight }]}
          textAlignVertical="top"
        />
        <Pressable
          onPress={handleMicPress}
          disabled={stage === 'transcribing'}
          style={({ pressed }) => [
            styles.micBtn,
            stage === 'recording' && styles.micBtnActive,
            pressed && styles.pressed,
          ]}
          hitSlop={8}
        >
          <Icon
            name={stage === 'recording' ? 'pause' : 'mic'}
            size={18}
            color={stage === 'recording' ? '#fff' : colors.navy}
            weight={2}
          />
        </Pressable>
      </View>

      {error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : micError ? (
        <Text style={styles.errorText}>{micError}</Text>
      ) : null}
    </View>
  );
}

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { gap: 6 },
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
  required: { color: colors.red },
  recordingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radii.pill,
    backgroundColor: colors.redSoft,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.red },
  recordingText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 10.5,
    color: colors.red,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  transcribingText: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 10.5,
    color: colors.navy,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    paddingRight: 4,
  },
  inputWrapError: { borderColor: colors.red },
  input: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    fontFamily: fonts.sans,
    fontSize: 15,
    color: colors.text,
  },
  micBtn: {
    marginTop: 6,
    marginRight: 4,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  micBtnActive: {
    backgroundColor: colors.red,
    borderColor: colors.red,
  },
  pressed: { opacity: 0.8 },
  errorText: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.red,
  },
});
