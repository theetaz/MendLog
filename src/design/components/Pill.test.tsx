import { render, screen } from '@testing-library/react-native';
import { Pill } from './Pill';
import { colors } from '../tokens';

describe('Pill', () => {
  it('renders its children', () => {
    render(<Pill>Awaiting TL</Pill>);
    expect(screen.getByText('Awaiting TL')).toBeTruthy();
  });

  it('applies custom background and color', () => {
    render(
      <Pill bg={colors.amberSoft} color={colors.amber} testID="pill">
        Pending
      </Pill>,
    );
    const pill = screen.getByTestId('pill');
    const style = Array.isArray(pill.props.style)
      ? Object.assign({}, ...pill.props.style)
      : pill.props.style;
    expect(style.backgroundColor).toBe(colors.amberSoft);
  });
});
