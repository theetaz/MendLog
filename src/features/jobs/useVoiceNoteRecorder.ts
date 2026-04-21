import {
  AudioQuality,
  IOSOutputFormat,
  type RecordingOptions,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import { useCallback, useEffect, useState } from 'react';
import {
  type ClipRow,
  createAndUploadClip,
  fetchClip,
  invokeTranscribe,
} from './clipsApi';

export const RECORDING_OPTIONS: RecordingOptions = {
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

export type VoiceNoteStage =
  | 'idle'
  | 'recording'
  | 'uploading'
  | 'processing'
  | 'done'
  | 'error';

export interface UseVoiceNoteRecorder {
  stage: VoiceNoteStage;
  clip: ClipRow | null;
  error: string | null;
  elapsedMs: number;
  start(): Promise<void>;
  stop(): Promise<void>;
  reset(): void;
}

interface Options {
  userId: string;
  onTranscribed?(clip: ClipRow): void;
}

export function useVoiceNoteRecorder({ userId, onTranscribed }: Options): UseVoiceNoteRecorder {
  const recorder = useAudioRecorder(RECORDING_OPTIONS);
  const recorderState = useAudioRecorderState(recorder, 250);

  const [stage, setStage] = useState<VoiceNoteStage>('idle');
  const [clip, setClip] = useState<ClipRow | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    if (stage !== 'recording') return;
    setElapsedMs(recorderState.durationMillis ?? 0);
  }, [recorderState.durationMillis, stage]);

  const start = useCallback(async () => {
    setError(null);
    try {
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
      setStage('recording');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not start recording');
      setStage('error');
    }
  }, [recorder]);

  const stop = useCallback(async () => {
    try {
      const durationMs = recorderState.durationMillis ?? elapsedMs;
      await recorder.stop();
      const uri = recorder.uri;
      if (!uri) throw new Error('no recording file produced');

      setStage('uploading');
      const row = await createAndUploadClip({ userId, localUri: uri, durationMs });
      setClip(row);

      setStage('processing');
      const result = await invokeTranscribe(row.id);
      const latest = await fetchClip(row.id).catch(() => null);
      const finalClip =
        latest ??
        ({
          ...row,
          transcript_raw: result.transcript_raw,
          transcript_clean: result.transcript_clean,
          transcript_en_raw: result.transcript_en_raw,
          transcript_en_clean: result.transcript_en_clean,
          status: 'done',
        } as ClipRow);
      setClip(finalClip);
      setStage('done');
      onTranscribed?.(finalClip);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Transcription failed');
      setStage('error');
    }
  }, [elapsedMs, onTranscribed, recorder, recorderState.durationMillis, userId]);

  const reset = useCallback(() => {
    setClip(null);
    setError(null);
    setElapsedMs(0);
    setStage('idle');
  }, []);

  return { stage, clip, error, elapsedMs, start, stop, reset };
}
