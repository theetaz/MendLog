import { render, screen, fireEvent } from '@testing-library/react-native';
import { ContributionGrid } from './ContributionGrid';
import { genActivity } from '../utils/activity';
import { heatColor } from '../utils/heat';

const REFERENCE = new Date('2026-03-15T00:00:00Z');

describe('ContributionGrid', () => {
  it('renders one cell per day in the supplied data', () => {
    const data = genActivity(4, REFERENCE);
    render(<ContributionGrid data={data} />);
    const cells = screen.getAllByTestId(/^cell-/);
    expect(cells).toHaveLength(data.length);
  });

  it('colors each cell according to its count', () => {
    const data = [
      { date: '2026-03-15', count: 0 },
      { date: '2026-03-16', count: 5 },
      { date: '2026-03-17', count: 10 },
    ];
    render(<ContributionGrid data={data} />);
    const flatten = (s: unknown) =>
      Array.isArray(s) ? Object.assign({}, ...s.flat().filter(Boolean)) : s;
    for (const day of data) {
      const cell = screen.getByTestId(`cell-${day.date}`);
      expect(flatten(cell.props.style).backgroundColor).toBe(heatColor(day.count));
    }
  });

  it('fires onCellTap with the ActivityDay when a cell is pressed', () => {
    const onCellTap = jest.fn();
    const data = genActivity(2, REFERENCE);
    render(<ContributionGrid data={data} onCellTap={onCellTap} />);
    fireEvent.press(screen.getByTestId(`cell-${data[3].date}`));
    expect(onCellTap).toHaveBeenCalledWith(data[3]);
  });

  it('renders weekday labels in the full variant only', () => {
    const data = genActivity(4, REFERENCE);
    const { rerender } = render(<ContributionGrid data={data} variant="full" />);
    expect(screen.getByText('Mon')).toBeTruthy();
    expect(screen.getByText('Wed')).toBeTruthy();
    expect(screen.getByText('Fri')).toBeTruthy();

    rerender(<ContributionGrid data={data} variant="compact" />);
    expect(screen.queryByText('Mon')).toBeNull();
  });
});
