import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { OnboardingScreen } from './OnboardingScreen';
import type { PermissionOutcome } from './permissionRequesters';

function makeRequester(defaultOutcome: PermissionOutcome = 'granted') {
  return jest.fn(async () => defaultOutcome);
}

describe('OnboardingScreen', () => {
  it('renders the first slide on mount', () => {
    render(<OnboardingScreen onComplete={jest.fn()} request={makeRequester()} />);
    expect(screen.getByTestId('onboarding-slide-microphone')).toBeTruthy();
    expect(screen.getByText('Record what happened')).toBeTruthy();
  });

  it('Allow advances through mic → camera → photos then completes', async () => {
    const onComplete = jest.fn();
    const request = makeRequester('granted');
    render(<OnboardingScreen onComplete={onComplete} request={request} />);

    await act(async () => {
      fireEvent.press(screen.getByTestId('onboarding-grant'));
    });
    await waitFor(() => expect(request).toHaveBeenCalledWith('microphone'));

    await act(async () => {
      fireEvent.press(screen.getByTestId('onboarding-grant'));
    });
    await waitFor(() => expect(request).toHaveBeenCalledWith('camera'));

    await act(async () => {
      fireEvent.press(screen.getByTestId('onboarding-grant'));
    });
    await waitFor(() =>
      expect(onComplete).toHaveBeenCalledWith({
        microphone: 'granted',
        camera: 'granted',
        photos: 'granted',
      }),
    );
  });

  it('skip is only available on the photos slide', async () => {
    render(<OnboardingScreen onComplete={jest.fn()} request={makeRequester()} />);
    expect(screen.queryByTestId('onboarding-skip')).toBeNull();

    await act(async () => {
      fireEvent.press(screen.getByTestId('onboarding-grant'));
    });
    await act(async () => {
      fireEvent.press(screen.getByTestId('onboarding-grant'));
    });

    expect(screen.getByTestId('onboarding-skip')).toBeTruthy();
  });

  it('skip records "skipped" and completes when on the last slide', async () => {
    const onComplete = jest.fn();
    render(<OnboardingScreen onComplete={onComplete} request={makeRequester()} />);
    await act(async () => fireEvent.press(screen.getByTestId('onboarding-grant')));
    await act(async () => fireEvent.press(screen.getByTestId('onboarding-grant')));
    await act(async () => fireEvent.press(screen.getByTestId('onboarding-skip')));
    await waitFor(() =>
      expect(onComplete).toHaveBeenCalledWith(
        expect.objectContaining({ photos: 'skipped' }),
      ),
    );
  });
});
