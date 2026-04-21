import type { IconName } from '../../design/components';

export type PermissionKey = 'microphone' | 'camera' | 'photos';

export interface PermissionSlide {
  key: PermissionKey;
  icon: IconName;
  title: string;
  body: string;
  rationale: string;
  canSkip: boolean;
}

export const PERMISSION_SLIDES: PermissionSlide[] = [
  {
    key: 'microphone',
    icon: 'mic',
    title: 'Record what happened',
    body: 'MendLog listens to your voice memo and transcribes it — in Sinhala or English — so you never have to type a paper form again.',
    rationale: 'Needed to record voice memos on every job.',
    canSkip: false,
  },
  {
    key: 'camera',
    icon: 'camera',
    title: 'Photograph the fault',
    body: 'Snap the broken part, the error code on the panel, the repair. Photos live with the job for your next search.',
    rationale: 'Needed to capture fault photos during a repair.',
    canSkip: false,
  },
  {
    key: 'photos',
    icon: 'photo',
    title: 'Save photos back',
    body: 'Keep a copy of repair photos in your phone library so you have them when MendLog is offline.',
    rationale: 'Optional — you can skip this.',
    canSkip: true,
  },
];
