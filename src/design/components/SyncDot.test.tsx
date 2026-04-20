import { render, screen } from '@testing-library/react-native';
import { SyncDot } from './SyncDot';

describe('SyncDot', () => {
  it('shows "Synced" label by default', () => {
    render(<SyncDot />);
    expect(screen.getByText('Synced')).toBeTruthy();
  });

  it('shows "Pending" label for pending state', () => {
    render(<SyncDot state="pending" />);
    expect(screen.getByText('Pending')).toBeTruthy();
  });

  it('shows "Offline" label for offline state', () => {
    render(<SyncDot state="offline" />);
    expect(screen.getByText('Offline')).toBeTruthy();
  });
});
