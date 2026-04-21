import type { SelectOption } from '../../components/form';
import type { JobStatus } from '../../types/job';

export const STATUS_OPTIONS: SelectOption[] = [
  { id: 'open', label: 'Open' },
  { id: 'awaiting-tl', label: 'Awaiting team leader' },
  { id: 'complete', label: 'Complete' },
];

export const DEFAULT_STATUS: JobStatus = 'complete';

export function statusOption(status: JobStatus): SelectOption {
  return STATUS_OPTIONS.find((o) => o.id === status) ?? STATUS_OPTIONS[2]!;
}
