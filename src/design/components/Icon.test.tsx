import { render, screen } from '@testing-library/react-native';
import { Icon, ICON_NAMES, type IconName } from './Icon';

describe('Icon', () => {
  it.each(ICON_NAMES)('renders %s without crashing', (name) => {
    render(<Icon name={name as IconName} testID={`icon-${name}`} />);
    expect(screen.getByTestId(`icon-${name}`)).toBeTruthy();
  });

  it('defaults to size 22', () => {
    render(<Icon name="home" testID="icon" />);
    const style = screen.getByTestId('icon').props.style;
    expect(style.width).toBe(22);
    expect(style.height).toBe(22);
  });

  it('respects the size prop', () => {
    render(<Icon name="home" size={32} testID="icon" />);
    const style = screen.getByTestId('icon').props.style;
    expect(style.width).toBe(32);
    expect(style.height).toBe(32);
  });

  it('renders null for unknown icon names', () => {
    render(<Icon name={'nope' as IconName} testID="icon" />);
    expect(screen.queryByTestId('icon')).toBeNull();
  });
});
