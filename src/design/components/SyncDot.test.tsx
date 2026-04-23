import { render, screen } from '@testing-library/react-native';
import { SyncDot } from './SyncDot';

describe('SyncDot', () => {
  it('shows "Synced" label by default', () => {
    render(<SyncDot />);
    expect(screen.getByText('Synced')).toBeTruthy();
  });

  it('shows "Uploading" label for pending/uploading state', () => {
    render(<SyncDot state="pending" />);
    expect(screen.getByText('Uploading')).toBeTruthy();
  });

  it('shows "Processing" label when AI work is in flight', () => {
    render(<SyncDot state="processing" />);
    expect(screen.getByText('Processing')).toBeTruthy();
  });

  it('shows "Needs attention" label on error', () => {
    render(<SyncDot state="error" />);
    expect(screen.getByText('Needs attention')).toBeTruthy();
  });

  it('shows "Offline" label for offline state', () => {
    render(<SyncDot state="offline" />);
    expect(screen.getByText('Offline')).toBeTruthy();
  });
});
