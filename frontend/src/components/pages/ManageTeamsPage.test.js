import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ManageTeamsPage from './ManageTeamsPage';
import { api } from '../../services/api';

// Mock the API
jest.mock('../../services/api');

const mockTeams = {
  count: 12,
  results: [
    { id: '1', name: 'Alpha Team', description: 'Alpha description', created_at: '2023-01-01' },
    { id: '2', name: 'Beta Team', description: 'Beta description', created_at: '2023-01-02' },
  ],
};

const mockOrgs = [{ id: 'org1', name: 'Test Org' }];

const mockMembers = [
  { id: 'm1', user: 'u1', user_name: 'Alice', user_email: 'alice@example.com', role: 'MEMBER' }
];

describe('ManageTeamsPage', () => {
  beforeEach(() => {
    api.getTeams.mockResolvedValue(mockTeams);
    api.getCurrentUser.mockResolvedValue({ id: 'u1', email: 'test@example.com' });
    api.getOrganizations.mockResolvedValue(mockOrgs);
    api.getTeamMembers.mockResolvedValue(mockMembers);
    jest.clearAllMocks();
  });

  test('renders team list correctly', async () => {
    render(
      <BrowserRouter>
        <ManageTeamsPage />
      </BrowserRouter>
    );

    // Check loading state
    expect(screen.getByText('Loading...')).toBeInTheDocument();

    // Check data loaded
    expect(await screen.findByText('Alpha Team')).toBeInTheDocument();
    expect(await screen.findByText('Beta Team')).toBeInTheDocument();
  });

  test('opens create modal on button click', async () => {
    render(
      <BrowserRouter>
        <ManageTeamsPage />
      </BrowserRouter>
    );
    const createBtn = await screen.findByText('New Team');

    fireEvent.click(createBtn);

    expect(screen.getByText('Create New Team')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('e.g. Engineering')).toBeInTheDocument();
  });

  test('calls createTeam API on form submit', async () => {
    api.createTeam.mockResolvedValue({ id: '3', name: 'Gamma Team' });
    render(
      <BrowserRouter>
        <ManageTeamsPage />
      </BrowserRouter>
    );

    const createBtn = await screen.findByText('New Team');
    fireEvent.click(createBtn);

    fireEvent.change(screen.getByPlaceholderText('e.g. Engineering'), { target: { value: 'Gamma Team' } });
    fireEvent.click(screen.getByText('Create Team', { selector: 'button[type="submit"]' }));

    await waitFor(() => {
      expect(api.createTeam).toHaveBeenCalledWith(expect.objectContaining({
        name: 'Gamma Team',
        organization: 'org1'
      }));
    });
  });

  test('opens members modal and shows members', async () => {
      render(
        <BrowserRouter>
          <ManageTeamsPage />
        </BrowserRouter>
      );
      await screen.findByText('Alpha Team');

      // Find the users button (first one)
      const usersButtons = screen.getAllByTitle('Manage Members');
      fireEvent.click(usersButtons[0]);

      expect(await screen.findByText('Members: Alpha Team')).toBeInTheDocument();
      expect(await screen.findByText('Alice')).toBeInTheDocument();
      expect(await screen.findByText('alice@example.com')).toBeInTheDocument();
  });
});
