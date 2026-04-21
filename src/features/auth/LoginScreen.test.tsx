import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { LoginScreen } from './LoginScreen';

describe('LoginScreen', () => {
  it('disables submit until a valid email + password are entered', () => {
    const onSubmit = jest.fn(async () => ({}));
    render(<LoginScreen onSubmit={onSubmit} />);
    const submit = screen.getByTestId('login-submit');

    fireEvent.press(submit);
    expect(onSubmit).not.toHaveBeenCalled();

    fireEvent.changeText(screen.getByTestId('login-email'), 'not-an-email');
    fireEvent.changeText(screen.getByTestId('login-password'), 'secret');
    fireEvent.press(submit);
    expect(onSubmit).not.toHaveBeenCalled();

    fireEvent.changeText(screen.getByTestId('login-email'), 'a@b.com');
    fireEvent.press(submit);
    expect(onSubmit).toHaveBeenCalledWith('a@b.com', 'secret');
  });

  it('renders an error banner when submit returns an error', async () => {
    const onSubmit = jest.fn(async () => ({ error: 'Invalid credentials' }));
    render(<LoginScreen onSubmit={onSubmit} />);

    fireEvent.changeText(screen.getByTestId('login-email'), 'a@b.com');
    fireEvent.changeText(screen.getByTestId('login-password'), 'x');
    await act(async () => {
      fireEvent.press(screen.getByTestId('login-submit'));
    });

    await waitFor(() => expect(screen.getByTestId('login-error')).toBeTruthy());
    expect(screen.getByText('Invalid credentials')).toBeTruthy();
  });

  it('toggles password visibility', () => {
    render(<LoginScreen onSubmit={jest.fn(async () => ({}))} />);
    const input = screen.getByTestId('login-password');
    expect(input.props.secureTextEntry).toBe(true);
    fireEvent.press(screen.getByTestId('login-toggle-password'));
    expect(input.props.secureTextEntry).toBe(false);
  });
});
