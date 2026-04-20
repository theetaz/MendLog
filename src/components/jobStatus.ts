import { colors } from '../design/tokens';
import type { JobStatus } from '../types/job';

export interface StatusTone {
  bg: string;
  fg: string;
  label: string;
}

export const STATUS_TONES: Record<JobStatus, StatusTone> = {
  complete: { bg: colors.emeraldSoft, fg: '#0D6B39', label: 'Complete' },
  'awaiting-tl': { bg: colors.amberSoft, fg: '#8C4A00', label: 'Awaiting TL' },
  open: { bg: colors.lineSoft, fg: colors.muteDeep, label: 'Open' },
};

export function statusTone(status: JobStatus): StatusTone {
  return STATUS_TONES[status];
}
