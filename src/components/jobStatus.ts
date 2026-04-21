import { colors as lightColors, type ThemeColors } from '../design/tokens';
import type { JobStatus } from '../types/job';

export interface StatusTone {
  bg: string;
  fg: string;
  label: string;
}

// Theme-aware status tone lookup. Foreground colors are intentionally hard-coded
// so they remain readable on the soft-tint backgrounds across both themes.
export function statusToneFor(status: JobStatus, colors: ThemeColors = lightColors): StatusTone {
  switch (status) {
    case 'complete':
      return { bg: colors.emeraldSoft, fg: colors.emerald, label: 'Complete' };
    case 'awaiting-tl':
      return { bg: colors.amberSoft, fg: colors.amber, label: 'Awaiting TL' };
    case 'open':
      return { bg: colors.lineSoft, fg: colors.muteDeep, label: 'Open' };
  }
}

// Back-compat default export used by components that haven't been theme-migrated.
export function statusTone(status: JobStatus): StatusTone {
  return statusToneFor(status);
}

export const STATUS_TONES: Record<JobStatus, StatusTone> = {
  complete: statusToneFor('complete'),
  'awaiting-tl': statusToneFor('awaiting-tl'),
  open: statusToneFor('open'),
};
