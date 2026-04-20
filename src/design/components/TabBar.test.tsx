import { render, screen, fireEvent } from '@testing-library/react-native';
import { TabBar } from './TabBar';

describe('TabBar', () => {
  it('renders the four labeled tabs', () => {
    render(<TabBar active="home" />);
    expect(screen.getByText('Home')).toBeTruthy();
    expect(screen.getByText('Jobs')).toBeTruthy();
    expect(screen.getByText('Search')).toBeTruthy();
    expect(screen.getByText('Me')).toBeTruthy();
  });

  it('renders the center FAB (no label)', () => {
    render(<TabBar active="home" />);
    expect(screen.getByTestId('tab-new')).toBeTruthy();
  });

  it('fires onTab with the tab id', () => {
    const onTab = jest.fn();
    render(<TabBar active="home" onTab={onTab} />);
    fireEvent.press(screen.getByTestId('tab-jobs'));
    expect(onTab).toHaveBeenCalledWith('jobs');
  });

  it('fires onTab when the FAB is pressed', () => {
    const onTab = jest.fn();
    render(<TabBar active="home" onTab={onTab} />);
    fireEvent.press(screen.getByTestId('tab-new'));
    expect(onTab).toHaveBeenCalledWith('new');
  });
});
