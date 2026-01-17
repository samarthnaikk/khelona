import { render, screen } from '@testing-library/react';
import App from './App';

test('renders Khelona title', () => {
  render(<App />);
  const titleElement = screen.getByText(/Khelona - 2 Player Games/i);
  expect(titleElement).toBeInTheDocument();
});
