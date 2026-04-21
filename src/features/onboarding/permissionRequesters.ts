import { Camera } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import { requestRecordingPermissionsAsync } from 'expo-audio';
import type { PermissionKey } from './permissionSlides';

export type PermissionOutcome = 'granted' | 'denied' | 'skipped';

export type PermissionRequester = (key: PermissionKey) => Promise<PermissionOutcome>;

export const defaultRequester: PermissionRequester = async (key) => {
  if (key === 'microphone') {
    const res = await requestRecordingPermissionsAsync();
    return res.granted ? 'granted' : 'denied';
  }
  if (key === 'camera') {
    const res = await Camera.requestCameraPermissionsAsync();
    return res.granted ? 'granted' : 'denied';
  }
  if (key === 'photos') {
    const res = await MediaLibrary.requestPermissionsAsync(false);
    return res.granted ? 'granted' : 'denied';
  }
  return 'denied';
};
