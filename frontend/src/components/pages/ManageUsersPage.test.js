import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ManageUsersPage from './ManageUsersPage';
import { api } from '../../services/api';

jest.mock('../../services/api');

const mockUsers = {
  count: 12,
  results: [
    { id: 'u1', name: 'Alice Admin', email: 'alice@example.com', created_at: '2023-01-01', teams: [{ id: 't1', name: 'Engineering' }] },
    { id: 'u2', name: 'Bob Developer', email: 'bob@example.com', created_at: '2023-01-02', teams: [] },
  ],
};

const mockOrgs = [{ id: 'org1', name: 'Test Org' }];

const mockTeams = {
  results: [
    { id: 't1', name: 'Engineering' },
    { id: 't2', name: 'Marketing' },
  ],
};

describe('ManageUsersPage', () => {
  beforeEach(() => {
    api.getUsers.mockResolvedValue(mockUsers);
    api.getOrganizations.mockResolvedValue(mockOrgs);
    api.getTeams.mockResolvedValue(mockTeams);
    api.getCurrentUser.mockResolvedValue({ id: 'u1', email: 'alice@example.com' });
    jest.clearAllMocks();
  });

  test('renders user list correctly', async () => {
    render(
      <BrowserRouter>
        <ManageUsersPage />
      </BrowserRouter>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();

    expect(await screen.findByText('Alice Admin')).toBeInTheDocument();
    expect(await screen.findByText('Bob Developer')).toBeInTheDocument();
    expect(await screen.findByText('alice@example.com')).toBeInTheDocument();
    expect(await screen.findByText('Engineering')).toBeInTheDocument();
  });

  test('opens create modal on button click', async () => {
    render(
      <BrowserRouter>
        <ManageUsersPage />
      </BrowserRouter>
    );
    const createBtn = await screen.findByText('New User');

    fireEvent.click(createBtn);

    expect(screen.getByText('Create New User')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('e.g. John Doe')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('user@example.com')).toBeInTheDocument();
  });

  test('calls createUser API on form submit', async () => {
    api.createUser.mockResolvedValue({ id: 'u3', name: 'Charlie Tester', email: 'charlie@example.com' });
    render(
      <BrowserRouter>
        <ManageUsersPage />
      </BrowserRouter>
    );

    const createBtn = await screen.findByText('New User');
    fireEvent.click(createBtn);

    fireEvent.change(screen.getByPlaceholderText('e.g. John Doe'), { target: { value: 'Charlie Tester' } });
    fireEvent.change(screen.getByPlaceholderText('user@example.com'), { target: { value: 'charlie@example.com' } });
    fireEvent.change(screen.getByPlaceholderText('Enter password'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByText('Create User', { selector: 'button[type="submit"]' }));

    await waitFor(() => {
      expect(api.createUser).toHaveBeenCalledWith(expect.objectContaining({
        name: 'Charlie Tester',
        email: 'charlie@example.com',
        password: 'password123',
        organization_id: 'org1',
      }));
    });
  });

  test('has manage teams buttons for each user', async () => {
    render(
      <BrowserRouter>
        <ManageUsersPage />
      </BrowserRouter>
    );

    await screen.findByText('Alice Admin');

    const teamsButtons = screen.getAllByTitle('Manage Teams');
    expect(teamsButtons.length).toBeGreaterThanOrEqual(2);
  });

  test('calls deleteUser API on delete button click', async () => {
    api.deleteUser.mockResolvedValue(true);
    window.confirm = jest.fn(() => true);

    render(
      <BrowserRouter>
        <ManageUsersPage />
      </BrowserRouter>
    );
    await screen.findByText('Alice Admin');

    const deleteButtons = screen.getAllByTitle('Delete User');
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(api.deleteUser).toHaveBeenCalledWith('u1', 'org1');
    });
  });

  test('has edit buttons for each user', async () => {
    render(
      <BrowserRouter>
        <ManageUsersPage />
      </BrowserRouter>
    );

    await screen.findByText('Alice Admin');

    const editButtons = screen.getAllByTitle('Edit User');
    expect(editButtons.length).toBe(2);
  });
});
