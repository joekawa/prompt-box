import { render, screen } from '@testing-library/react';
import App from './App';

test('renders prompt box welcome page', () => {
  render(<App />);
  const logoElement = screen.getByText('Prompt Box');
  expect(logoElement).toBeInTheDocument();
});
