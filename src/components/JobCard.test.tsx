import { render, screen, fireEvent } from '@testing-library/react-native';
import { JobCard } from './JobCard';
import { STATUS_TONES } from './jobStatus';
import type { Job } from '../types/job';

const FIXTURE: Job = {
  id: 127,
  machine: 'Injection Molder #3',
  dept: 'Moulding',
  inv: 'INV-0331',
  date: '2026-03-15',
  time: '09:14',
  idleMinutes: 260,
  status: 'awaiting-tl',
  lang: 'si',
  photos: 3,
  clips: 2,
  rootCause: 'Hydraulic seal failure on main cylinder — pressure dropped below spec',
  desc: '',
  action: '',
  remarks: '',
};

describe('JobCard (full variant)', () => {
  it('renders machine name and dept', () => {
    render(<JobCard job={FIXTURE} />);
    expect(screen.getByText('Injection Molder #3')).toBeTruthy();
    expect(screen.getByText(/Moulding/)).toBeTruthy();
  });

  it('renders the status label matching the job status', () => {
    render(<JobCard job={FIXTURE} />);
    expect(screen.getByText(STATUS_TONES['awaiting-tl'].label)).toBeTruthy();
  });

  it('renders photo and clip counts', () => {
    render(<JobCard job={FIXTURE} />);
    expect(screen.getByText('3')).toBeTruthy();
    expect(screen.getByText('2')).toBeTruthy();
  });

  it('renders the root cause', () => {
    render(<JobCard job={FIXTURE} />);
    expect(screen.getByText(/Hydraulic seal failure/)).toBeTruthy();
  });

  it('fires onPress when pressed', () => {
    const onPress = jest.fn();
    render(<JobCard job={FIXTURE} onPress={onPress} testID="card" />);
    fireEvent.press(screen.getByTestId('card'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});

describe('JobCard (horizontal variant)', () => {
  it('renders time badge with job time', () => {
    render(<JobCard job={FIXTURE} variant="horizontal" />);
    expect(screen.getByText('09:14')).toBeTruthy();
  });

  it('renders machine name and dept · idle summary', () => {
    render(<JobCard job={FIXTURE} variant="horizontal" />);
    expect(screen.getByText('Injection Molder #3')).toBeTruthy();
    expect(screen.getByText(/Moulding/)).toBeTruthy();
    expect(screen.getByText(/4h 20m idle/)).toBeTruthy();
  });
});

describe('JobCard (compact variant)', () => {
  it('renders job id prefixed with hash', () => {
    render(<JobCard job={FIXTURE} variant="compact" />);
    expect(screen.getByText('#127')).toBeTruthy();
  });

  it('renders idle time', () => {
    render(<JobCard job={FIXTURE} variant="compact" />);
    expect(screen.getByText('4h 20m idle')).toBeTruthy();
  });

  it('renders the language badge', () => {
    render(<JobCard job={FIXTURE} variant="compact" />);
    expect(screen.getByText('සිං')).toBeTruthy();
  });
});
