import { render, screen, fireEvent } from '@testing-library/react-native';
import { Text } from 'react-native';
import { Card } from './Card';

describe('Card', () => {
  it('renders its children', () => {
    render(
      <Card>
        <Text>Machine #3</Text>
      </Card>,
    );
    expect(screen.getByText('Machine #3')).toBeTruthy();
  });

  it('fires onPress when provided', () => {
    const onPress = jest.fn();
    render(
      <Card onPress={onPress} testID="card">
        <Text>tap me</Text>
      </Card>,
    );
    fireEvent.press(screen.getByTestId('card'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('renders a plain view (no press handler) when onPress is omitted', () => {
    render(
      <Card testID="card">
        <Text>static</Text>
      </Card>,
    );
    const node = screen.getByTestId('card');
    expect(node.props.onClick).toBeUndefined();
  });
});
