import { render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import { AppBar } from './AppBar';

describe('AppBar', () => {
  it('renders the title', () => {
    render(<AppBar title="Home" />);
    expect(screen.getByText('Home')).toBeTruthy();
  });

  it('renders an optional subtitle above the title', () => {
    render(<AppBar title="Jobs" subtitle="12 this week" />);
    expect(screen.getByText('12 this week')).toBeTruthy();
    expect(screen.getByText('Jobs')).toBeTruthy();
  });

  it('shows a SyncDot by default', () => {
    render(<AppBar title="Home" />);
    expect(screen.getByText('Synced')).toBeTruthy();
  });

  it('honours the sync state prop', () => {
    render(<AppBar title="Home" sync="offline" />);
    expect(screen.getByText('Offline')).toBeTruthy();
  });

  it('renders the left and right slots when provided', () => {
    render(
      <AppBar
        title="Home"
        left={<Text>LEFT</Text>}
        right={<Text>RIGHT</Text>}
      />,
    );
    expect(screen.getByText('LEFT')).toBeTruthy();
    expect(screen.getByText('RIGHT')).toBeTruthy();
  });
});
