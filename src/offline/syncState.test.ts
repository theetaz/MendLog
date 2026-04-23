import {
  computeJobSyncBreakdown,
  computeJobSyncState,
  worseOf,
  type JobLike,
  type PhotoLike,
  type ClipLike,
} from './syncState';

const job = (sync_state = 'synced'): JobLike => ({ sync_state });

const photo = (
  over: Partial<PhotoLike> = {},
): PhotoLike => ({
  sync_state: 'synced',
  upload_state: 'uploaded',
  status: 'done',
  ...over,
});

const clip = (over: Partial<ClipLike> = {}): ClipLike => ({
  sync_state: 'synced',
  upload_state: 'uploaded',
  status: 'done',
  ...over,
});

describe('computeJobSyncState', () => {
  it('returns offline when the job itself has not pushed', () => {
    expect(computeJobSyncState(job('pending_insert'), [], [])).toBe('offline');
    expect(computeJobSyncState(job('pending_update'), [photo()], [])).toBe('offline');
  });

  it('returns synced when everything is done', () => {
    expect(computeJobSyncState(job(), [photo()], [clip()])).toBe('synced');
    expect(computeJobSyncState(job(), [], [])).toBe('synced');
  });

  it('returns uploading when a photo is still uploading', () => {
    expect(
      computeJobSyncState(job(), [photo({ upload_state: 'pending' })], []),
    ).toBe('uploading');
    expect(
      computeJobSyncState(job(), [photo({ upload_state: 'uploading' })], []),
    ).toBe('uploading');
  });

  it('returns uploading when a photo row is synced but upload_state failed', () => {
    // upload_state=failed is an error condition — user probably needs to retry.
    expect(
      computeJobSyncState(job(), [photo({ upload_state: 'failed' })], []),
    ).toBe('error');
  });

  it('returns uploading when a photo is uploaded but the row still needs to push', () => {
    expect(
      computeJobSyncState(
        job(),
        [photo({ sync_state: 'pending_update' })],
        [],
      ),
    ).toBe('uploading');
  });

  it('returns processing when a photo is uploaded+synced but annotation still pending', () => {
    expect(
      computeJobSyncState(job(), [photo({ status: 'pending' })], []),
    ).toBe('processing');
    expect(
      computeJobSyncState(job(), [photo({ status: 'annotating' })], []),
    ).toBe('processing');
  });

  it('returns processing for a clip mid-transcription', () => {
    expect(
      computeJobSyncState(job(), [], [clip({ status: 'transcribing' })]),
    ).toBe('processing');
    expect(
      computeJobSyncState(job(), [], [clip({ status: 'post_processing' })]),
    ).toBe('processing');
  });

  it('returns error when any child has errored', () => {
    expect(
      computeJobSyncState(job(), [photo({ status: 'error' })], []),
    ).toBe('error');
    expect(
      computeJobSyncState(job(), [], [clip({ status: 'error' })]),
    ).toBe('error');
  });

  it('prefers the worst state among mixed children', () => {
    // uploading beats processing beats synced.
    const result = computeJobSyncState(
      job(),
      [photo({ status: 'pending' }), photo({ upload_state: 'pending' })],
      [clip()],
    );
    expect(result).toBe('uploading');
  });

  it('error outranks uploading and processing', () => {
    const result = computeJobSyncState(
      job(),
      [photo({ status: 'error' }), photo({ upload_state: 'pending' })],
      [],
    );
    expect(result).toBe('error');
  });

  it('offline outranks everything', () => {
    const result = computeJobSyncState(
      job('pending_insert'),
      [photo({ status: 'error' })],
      [],
    );
    expect(result).toBe('offline');
  });
});

describe('worseOf', () => {
  it('picks the higher-severity state', () => {
    expect(worseOf('synced', 'processing')).toBe('processing');
    expect(worseOf('uploading', 'processing')).toBe('uploading');
    expect(worseOf('error', 'uploading')).toBe('error');
    expect(worseOf('offline', 'error')).toBe('offline');
  });

  it('returns either input when equal', () => {
    expect(worseOf('synced', 'synced')).toBe('synced');
  });
});

describe('computeJobSyncBreakdown', () => {
  it('counts each bucket independently', () => {
    const b = computeJobSyncBreakdown(
      [
        photo({ upload_state: 'pending' }), // uploading
        photo({ status: 'pending' }), // processing
        photo({ status: 'error' }), // error
        photo(), // done
        photo(), // done
      ],
      [
        clip({ status: 'transcribing' }), // processing
        clip(), // done
      ],
    );
    expect(b).toEqual({
      photosUploading: 1,
      photosProcessing: 1,
      photosError: 1,
      photosDone: 2,
      clipsUploading: 0,
      clipsProcessing: 1,
      clipsError: 0,
      clipsDone: 1,
    });
  });

  it('returns all zeros for empty inputs', () => {
    expect(computeJobSyncBreakdown([], [])).toEqual({
      photosUploading: 0,
      photosProcessing: 0,
      photosError: 0,
      photosDone: 0,
      clipsUploading: 0,
      clipsProcessing: 0,
      clipsError: 0,
      clipsDone: 0,
    });
  });
});
