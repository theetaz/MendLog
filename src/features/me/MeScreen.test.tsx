import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { MeScreen } from './MeScreen';

function renderWithConfirm(signOut: jest.Mock) {
  // Bypass the native Alert — run the onConfirm callback immediately.
  const confirmSignOut = (onConfirm: () => void) => onConfirm();
  render(<MeScreen email="a@b.com" onSignOut={signOut} confirmSignOut={confirmSignOut} />);
}

describe('MeScreen', () => {
  it('shows the session email and a fallback avatar initial', () => {
    render(
      <MeScreen
        email="theekshana2@gmail.com"
        onSignOut={jest.fn(async () => {})}
        confirmSignOut={() => {}}
      />,
    );
    expect(screen.getByText('theekshana2@gmail.com')).toBeTruthy();
    expect(screen.getByText('T')).toBeTruthy();
  });

  it('prefers displayName for the avatar initial and the header line', () => {
    render(
      <MeScreen
        email="a@b.com"
        displayName="Nuwan"
        onSignOut={jest.fn(async () => {})}
        confirmSignOut={() => {}}
      />,
    );
    expect(screen.getByText('Nuwan')).toBeTruthy();
    expect(screen.getByText('N')).toBeTruthy();
  });

  it('calls onSignOut when Sign out is pressed and the user confirms', async () => {
    const signOut = jest.fn(async () => {});
    renderWithConfirm(signOut);
    await act(async () => {
      fireEvent.press(screen.getByTestId('me-sign-out'));
    });
    await waitFor(() => expect(signOut).toHaveBeenCalledTimes(1));
  });

  it('does not sign out when the user cancels the confirmation', () => {
    const signOut = jest.fn(async () => {});
    // confirm that does nothing = user hit cancel
    render(<MeScreen email="a@b.com" onSignOut={signOut} confirmSignOut={() => {}} />);
    fireEvent.press(screen.getByTestId('me-sign-out'));
    expect(signOut).not.toHaveBeenCalled();
  });
});
