import { render, screen, fireEvent } from '@testing-library/react-native';
import { Btn } from './Btn';
import { colors } from '../tokens';

function flattenStyle(node: { props: { style?: unknown } }) {
  const raw = node.props.style;
  if (Array.isArray(raw)) return Object.assign({}, ...raw.flat().filter(Boolean));
  return (raw as object) ?? {};
}

describe('Btn', () => {
  it('renders its label', () => {
    render(<Btn>File job</Btn>);
    expect(screen.getByText('File job')).toBeTruthy();
  });

  it('fires onPress', () => {
    const onPress = jest.fn();
    render(<Btn onPress={onPress}>tap</Btn>);
    fireEvent.press(screen.getByText('tap'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('uses yellow background for primary kind', () => {
    render(<Btn testID="btn">Save</Btn>);
    const style = flattenStyle(screen.getByTestId('btn'));
    expect(style.backgroundColor).toBe(colors.yellow);
  });

  it('uses navy background for navy kind', () => {
    render(
      <Btn testID="btn" kind="navy">
        Navy
      </Btn>,
    );
    const style = flattenStyle(screen.getByTestId('btn'));
    expect(style.backgroundColor).toBe(colors.navy);
  });

  it('uses transparent background for ghost kind', () => {
    render(
      <Btn testID="btn" kind="ghost">
        Cancel
      </Btn>,
    );
    const style = flattenStyle(screen.getByTestId('btn'));
    expect(style.backgroundColor).toBe('transparent');
  });

  it('respects block=true by spanning full width', () => {
    render(
      <Btn testID="btn" block>
        Wide
      </Btn>,
    );
    const style = flattenStyle(screen.getByTestId('btn'));
    expect(style.alignSelf).toBe('stretch');
  });

  it('disables press when disabled', () => {
    const onPress = jest.fn();
    render(
      <Btn testID="btn" onPress={onPress} disabled>
        off
      </Btn>,
    );
    fireEvent.press(screen.getByTestId('btn'));
    expect(onPress).not.toHaveBeenCalled();
  });
});
