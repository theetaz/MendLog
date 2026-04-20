import { render, screen } from '@testing-library/react-native';
import { LangBadge } from './LangBadge';

describe('LangBadge', () => {
  it('renders "EN" for english', () => {
    render(<LangBadge lang="en" />);
    expect(screen.getByText('EN')).toBeTruthy();
  });

  it('renders sinhala glyph for si', () => {
    render(<LangBadge lang="si" />);
    expect(screen.getByText('සිං')).toBeTruthy();
  });

  it('defaults to english', () => {
    render(<LangBadge />);
    expect(screen.getByText('EN')).toBeTruthy();
  });
});
