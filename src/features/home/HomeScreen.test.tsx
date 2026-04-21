import { render, screen, waitFor, fireEvent } from '@testing-library/react-native';
import { InMemoryJobsRepository } from '../../repositories/InMemoryJobsRepository';
import { SEED_JOBS, SEED_REFERENCE_DATE } from '../../data/seedJobs';
import { HomeScreen } from './HomeScreen';

function makeRepo() {
  return new InMemoryJobsRepository(SEED_JOBS, SEED_REFERENCE_DATE);
}

describe('HomeScreen', () => {
  it('renders a skeleton while loading', () => {
    const repo = makeRepo();
    render(<HomeScreen repo={repo} clock={() => SEED_REFERENCE_DATE} userName="Nuwan" />);
    expect(screen.getByTestId('home-loading')).toBeTruthy();
  });

  it('greets the user by name', async () => {
    const repo = makeRepo();
    render(<HomeScreen repo={repo} clock={() => SEED_REFERENCE_DATE} userName="Nuwan" />);
    await waitFor(() => expect(screen.queryByTestId('home-loading')).toBeNull());
    expect(screen.getByText(/Hello, Nuwan/)).toBeTruthy();
  });

  it('shows today count and the three seeded today-jobs', async () => {
    const repo = makeRepo();
    render(<HomeScreen repo={repo} clock={() => SEED_REFERENCE_DATE} userName="Nuwan" />);
    await waitFor(() => expect(screen.queryByTestId('home-loading')).toBeNull());
    expect(screen.getByText('3 jobs today')).toBeTruthy();
    expect(screen.getByText('Injection Molder #3')).toBeTruthy();
    expect(screen.getByText('CNC Lathe B-7')).toBeTruthy();
    expect(screen.getByText('Conveyor Line 2')).toBeTruthy();
  });

  it('renders the weekly stats', async () => {
    const repo = makeRepo();
    render(<HomeScreen repo={repo} clock={() => SEED_REFERENCE_DATE} userName="Nuwan" />);
    await waitFor(() => expect(screen.queryByTestId('home-loading')).toBeNull());
    expect(screen.getAllByText('7').length).toBeGreaterThan(0);
    expect(screen.getByText('2h 41m')).toBeTruthy();
    expect(screen.getAllByText('4').length).toBeGreaterThan(0);
  });

  it('fires onOpenJob when a today card is pressed', async () => {
    const repo = makeRepo();
    const onOpenJob = jest.fn();
    render(
      <HomeScreen
        repo={repo}
        clock={() => SEED_REFERENCE_DATE}
        userName="Nuwan"
        onOpenJob={onOpenJob}
      />,
    );
    await waitFor(() => expect(screen.queryByTestId('home-loading')).toBeNull());
    fireEvent.press(screen.getByTestId('home-today-card-127'));
    expect(onOpenJob).toHaveBeenCalledWith(127);
  });

  it('renders an error banner when the repository fails', async () => {
    const failingRepo = {
      listJobs: jest.fn().mockRejectedValue(new Error('network down')),
      listJobsForDate: jest.fn().mockResolvedValue([]),
      getJob: jest.fn(),
      getActivity: jest.fn().mockResolvedValue([]),
    };
    render(<HomeScreen repo={failingRepo} clock={() => SEED_REFERENCE_DATE} userName="Nuwan" />);
    await waitFor(() => expect(screen.queryByTestId('home-loading')).toBeNull());
    expect(screen.getByText(/network down/)).toBeTruthy();
  });
});
