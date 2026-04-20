import { render, screen } from '@testing-library/react-native';
import { PhotoBox } from './PhotoBox';

describe('PhotoBox', () => {
  it('renders a view with the provided testID', () => {
    render(<PhotoBox seed={0} testID="photo" />);
    expect(screen.getByTestId('photo')).toBeTruthy();
  });

  it('is deterministic: same seed yields the same background', () => {
    const { rerender } = render(<PhotoBox seed={7} testID="photo-a" />);
    const a = screen.getByTestId('photo-a').props.style;
    rerender(<PhotoBox seed={7} testID="photo-b" />);
    const b = screen.getByTestId('photo-b').props.style;
    const flatten = (s: unknown) =>
      Array.isArray(s) ? Object.assign({}, ...s.flat().filter(Boolean)) : s;
    expect(flatten(a).backgroundColor).toBe(flatten(b).backgroundColor);
  });

  it('respects the size prop', () => {
    render(<PhotoBox seed={0} size={50} testID="photo" />);
    const style = Array.isArray(screen.getByTestId('photo').props.style)
      ? Object.assign({}, ...screen.getByTestId('photo').props.style.flat().filter(Boolean))
      : screen.getByTestId('photo').props.style;
    expect(style.width).toBe(50);
    expect(style.height).toBe(50);
  });
});
