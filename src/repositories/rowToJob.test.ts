import { rowToJob, type JobRow } from './rowToJob';

const ROW: JobRow = {
  id: 127,
  user_id: '00000000-0000-0000-0000-000000000000',
  machine: 'Injection Molder #3',
  dept: 'Moulding',
  inv: 'INV-0331',
  date: '2026-03-15',
  reported_time: '09:14:00',
  completed_at: null,
  idle_minutes: 260,
  status: 'awaiting-tl',
  lang: 'si',
  photos: 3,
  clips: 2,
  root_cause: 'Seal failure',
  description: 'Loud hiss',
  corrective_action: 'Replaced seal kit',
  remarks: '',
  created_at: '2026-03-15T09:14:00Z',
  updated_at: '2026-03-15T09:14:00Z',
};

describe('rowToJob', () => {
  it('maps db columns to the Job shape', () => {
    const job = rowToJob(ROW);
    expect(job.id).toBe('127');
    expect(job.machine).toBe('Injection Molder #3');
    expect(job.dept).toBe('Moulding');
    expect(job.inv).toBe('INV-0331');
    expect(job.date).toBe('2026-03-15');
    expect(job.idleMinutes).toBe(260);
    expect(job.status).toBe('awaiting-tl');
    expect(job.lang).toBe('si');
    expect(job.photos).toBe(3);
    expect(job.clips).toBe(2);
    expect(job.rootCause).toBe('Seal failure');
    expect(job.desc).toBe('Loud hiss');
    expect(job.action).toBe('Replaced seal kit');
    expect(job.remarks).toBe('');
  });

  it('trims seconds off reported_time → HH:MM', () => {
    expect(rowToJob(ROW).time).toBe('09:14');
  });

  it('coerces null inv to empty string', () => {
    const job = rowToJob({ ...ROW, inv: null });
    expect(job.inv).toBe('');
  });

  it('stringifies a numeric bigserial id', () => {
    const job = rowToJob({ ...ROW, id: 127 });
    expect(job.id).toBe('127');
  });

  it('passes through an already-stringified id', () => {
    const job = rowToJob({ ...ROW, id: '127' });
    expect(job.id).toBe('127');
  });
});
