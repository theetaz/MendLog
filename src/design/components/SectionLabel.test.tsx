import { render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import { SectionLabel } from './SectionLabel';

describe('SectionLabel', () => {
  it('uppercases and renders its text', () => {
    render(<SectionLabel>Team leader</SectionLabel>);
    expect(screen.getByText('Team leader')).toBeTruthy();
  });

  it('renders an optional right slot', () => {
    render(
      <SectionLabel right={<Text>See all</Text>}>Today</SectionLabel>,
    );
    expect(screen.getByText('Today')).toBeTruthy();
    expect(screen.getByText('See all')).toBeTruthy();
  });
});
