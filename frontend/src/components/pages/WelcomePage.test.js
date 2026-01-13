import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import WelcomePage from './WelcomePage';

// Wrap component in Router since it uses useNavigate
const MockWelcomePage = () => {
  return (
    <BrowserRouter>
      <WelcomePage />
    </BrowserRouter>
  );
};

test('renders welcome page header and hero section', () => {
  render(<MockWelcomePage />);

  // Check for main title
  expect(screen.getByText(/Enterprise-Grade AI Prompt Management/i)).toBeInTheDocument();

  // Check for buttons
  expect(screen.getByText('Login')).toBeInTheDocument();
  expect(screen.getByText('Get Started')).toBeInTheDocument();
  expect(screen.getByText('Request Demo')).toBeInTheDocument();
});

test('renders feature cards', () => {
  render(<MockWelcomePage />);

  expect(screen.getByText('RBAC & Security')).toBeInTheDocument();
  expect(screen.getByText('Team Hierarchy')).toBeInTheDocument();
  expect(screen.getByText('Model Agnostic')).toBeInTheDocument();
});
