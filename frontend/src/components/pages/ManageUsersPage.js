import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api';
import { PlusCircle, Edit2, Trash2, Users, X } from 'lucide-react';
import Sidebar from '../shared/Sidebar';

const ManageUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showTeamsModal, setShowTeamsModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [allTeams, setAllTeams] = useState([]);
  const [organizationId, setOrganizationId] = useState(null);

  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [selectedTeamId, setSelectedTeamId] = useState('');

  const fetchOrganization = useCallback(async () => {
    console.log('[ManageUsersPage] Fetching organization...');
    try {
      const orgs = await api.getOrganizations();
      console.log('[ManageUsersPage] Organizations fetched:', orgs);
      if (orgs.length > 0) {
        setOrganizationId(orgs[0].id);
        return orgs[0].id;
      }
      throw new Error('No organization found');
    } catch (err) {
      console.error('[ManageUsersPage] Failed to fetch organization:', err);
      setError('Failed to load organization.');
      return null;
    }
  }, []);

  const fetchUsers = useCallback(async (orgId) => {
    if (!orgId) {
      console.warn('[ManageUsersPage] No organization ID, skipping user fetch');
      return;
    }
    console.log('[ManageUsersPage] Fetching users for org:', orgId, 'page:', page);
    setLoading(true);
    try {
      const data = await api.getUsers({ organization_id: orgId, page });
      console.log('[ManageUsersPage] Users fetched:', data);
      setUsers(data.results);
      setTotalPages(Math.ceil(data.count / 10));
      setError(null);
    } catch (err) {
      console.error('[ManageUsersPage] Failed to load users:', err);
      setError('Failed to load users.');
    } finally {
      setLoading(false);
    }
  }, [page]);

  const fetchTeams = useCallback(async (orgId) => {
    if (!orgId) return;
    console.log('[ManageUsersPage] Fetching teams for org:', orgId);
    try {
      const data = await api.getTeams({ organization: orgId });
      console.log('[ManageUsersPage] Teams fetched:', data);
      setAllTeams(data.results || data);
    } catch (err) {
      console.error('[ManageUsersPage] Failed to fetch teams:', err);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      const orgId = await fetchOrganization();
      if (orgId) {
        await fetchUsers(orgId);
        await fetchTeams(orgId);
      }
    };
    init();
  }, [fetchOrganization, fetchUsers, fetchTeams]);

  useEffect(() => {
    if (organizationId) {
      fetchUsers(organizationId);
    }
  }, [page, organizationId, fetchUsers]);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    console.log('[ManageUsersPage] Creating user with data:', formData);
    try {
      await api.createUser({
        ...formData,
        organization_id: organizationId,
        organization_role: 'MEMBER',
      });
      console.log('[ManageUsersPage] User created successfully');
      setShowCreateModal(false);
      setFormData({ name: '', email: '', password: '' });
      fetchUsers(organizationId);
    } catch (err) {
      console.error('[ManageUsersPage] Failed to create user:', err);
      alert('Failed to create user: ' + err.message);
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    console.log('[ManageUsersPage] Updating user:', editingUser.id, 'with data:', formData);
    try {
      const updateData = { name: formData.name, email: formData.email };
      if (formData.password) {
        updateData.password = formData.password;
      }
      await api.updateUser(editingUser.id, updateData);
      console.log('[ManageUsersPage] User updated successfully');
      setEditingUser(null);
      setShowCreateModal(false);
      setFormData({ name: '', email: '', password: '' });
      fetchUsers(organizationId);
    } catch (err) {
      console.error('[ManageUsersPage] Failed to update user:', err);
      alert('Failed to update user: ' + err.message);
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    console.log('[ManageUsersPage] Deleting user:', id);
    try {
      await api.deleteUser(id, organizationId);
      console.log('[ManageUsersPage] User deleted successfully');
      fetchUsers(organizationId);
    } catch (err) {
      console.error('[ManageUsersPage] Failed to delete user:', err);
      alert('Failed to delete user: ' + err.message);
    }
  };

  const openEditModal = (user) => {
    console.log('[ManageUsersPage] Opening edit modal for user:', user);
    setEditingUser(user);
    setFormData({ name: user.name, email: user.email, password: '' });
    setShowCreateModal(true);
  };

  const openTeamsModal = (user) => {
    console.log('[ManageUsersPage] Opening teams modal for user:', user);
    setSelectedUser(user);
    setSelectedTeamId('');
    setShowTeamsModal(true);
  };

  const handleAssignTeam = async (e) => {
    e.preventDefault();
    if (!selectedTeamId) {
      alert('Please select a team');
      return;
    }
    console.log('[ManageUsersPage] Assigning team:', selectedTeamId, 'to user:', selectedUser.id);
    try {
      await api.assignUserTeam(selectedUser.id, selectedTeamId);
      console.log('[ManageUsersPage] Team assigned successfully');
      setSelectedTeamId('');
      fetchUsers(organizationId);
      const updatedUsers = await api.getUsers({ organization_id: organizationId, page });
      const updatedUser = updatedUsers.results.find(u => u.id === selectedUser.id);
      if (updatedUser) {
        setSelectedUser(updatedUser);
      }
    } catch (err) {
      console.error('[ManageUsersPage] Failed to assign team:', err);
      alert('Failed to assign team: ' + err.message);
    }
  };

  const handleRemoveTeam = async (teamId) => {
    if (!window.confirm('Remove this user from the team?')) return;
    console.log('[ManageUsersPage] Removing team:', teamId, 'from user:', selectedUser.id);
    try {
      await api.removeUserTeam(selectedUser.id, teamId);
      console.log('[ManageUsersPage] Team removed successfully');
      fetchUsers(organizationId);
      const updatedUsers = await api.getUsers({ organization_id: organizationId, page });
      const updatedUser = updatedUsers.results.find(u => u.id === selectedUser.id);
      if (updatedUser) {
        setSelectedUser(updatedUser);
      }
    } catch (err) {
      console.error('[ManageUsersPage] Failed to remove team:', err);
      alert('Failed to remove team: ' + err.message);
    }
  };

  const getAvailableTeams = () => {
    if (!selectedUser || !selectedUser.teams) return allTeams;
    const assignedTeamIds = selectedUser.teams.map(t => t.id);
    return allTeams.filter(t => !assignedTeamIds.includes(t.id));
  };

  return (
    <div className="dashboard-container">
      <Sidebar />
      <main className="main-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', width: '100%' }}>
          <div>
            <h1 className="page-title" style={{ marginBottom: '8px' }}>Manage Users</h1>
            <p className="text-secondary">Create and manage users within your organization.</p>
          </div>
          <button
            className="btn-primary"
            onClick={() => {
              console.log('[ManageUsersPage] Opening create user modal');
              setEditingUser(null);
              setFormData({ name: '', email: '', password: '' });
              setShowCreateModal(true);
            }}
          >
            <PlusCircle size={18} /> New User
          </button>
        </div>

        {error && (
          <div className="error-message" style={{ marginBottom: '20px' }}>
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px', width: '100%' }}>
            <p>Loading...</p>
          </div>
        ) : (
          <div className="content-card" style={{ width: '100%' }}>
            <div className="table-container">
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e5e7eb', textAlign: 'left' }}>
                    <th style={{ padding: '12px 16px', color: '#6b7280', fontSize: '0.875rem', fontWeight: 600 }}>User Name</th>
                    <th style={{ padding: '12px 16px', color: '#6b7280', fontSize: '0.875rem', fontWeight: 600 }}>Email</th>
                    <th style={{ padding: '12px 16px', color: '#6b7280', fontSize: '0.875rem', fontWeight: 600 }}>Assigned Teams</th>
                    <th style={{ padding: '12px 16px', color: '#6b7280', fontSize: '0.875rem', fontWeight: 600 }}>Created</th>
                    <th style={{ padding: '12px 16px', color: '#6b7280', fontSize: '0.875rem', fontWeight: 600 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ padding: '24px', textAlign: 'center', color: '#6b7280' }}>
                        No users found. Create one to get started.
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => (
                      <tr key={user.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                        <td style={{ padding: '12px 16px', fontWeight: 500, color: '#111827' }}>{user.name}</td>
                        <td style={{ padding: '12px 16px', color: '#4b5563' }}>{user.email}</td>
                        <td style={{ padding: '12px 16px', color: '#4b5563', maxWidth: '200px' }}>
                          {user.teams && user.teams.length > 0
                            ? user.teams.map(t => t.name).join(', ')
                            : '-'}
                        </td>
                        <td style={{ padding: '12px 16px', color: '#6b7280', fontSize: '0.875rem' }}>
                          {new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              onClick={() => openTeamsModal(user)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}
                              title="Manage Teams"
                            >
                              <Users size={16} />
                            </button>
                            <button
                              onClick={() => openEditModal(user)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}
                              title="Edit User"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}
                              title="Delete User"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginTop: '24px', padding: '12px' }}>
                <button
                  className="btn-secondary"
                  disabled={page === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </button>
                <span style={{ fontSize: '0.875rem', color: '#4b5563' }}>
                  Page {page} of {totalPages}
                </span>
                <button
                  className="btn-secondary"
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}

        {showCreateModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
          }}>
            <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '8px', width: '420px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ margin: 0 }}>{editingUser ? 'Edit User' : 'Create New User'}</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}
                  title="Close"
                  type="button"
                >
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={editingUser ? handleUpdateUser : handleCreateUser}>
                <div className="form-group">
                  <label className="form-label">Name</label>
                  <input
                    className="form-input"
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. John Doe"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input
                    className="form-input"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="user@example.com"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">{editingUser ? 'Password (leave blank to keep current)' : 'Password'}</label>
                  <input
                    className="form-input"
                    type="password"
                    required={!editingUser}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder={editingUser ? '(unchanged)' : 'Enter password'}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                  <button className="btn-secondary" type="button" onClick={() => setShowCreateModal(false)}>
                    Cancel
                  </button>
                  <button className="btn-primary" type="submit">
                    {editingUser ? 'Save Changes' : 'Create User'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showTeamsModal && selectedUser && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
          }}>
            <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '8px', width: '560px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ margin: 0 }}>Teams: {selectedUser.name}</h3>
                <button
                  onClick={() => setShowTeamsModal(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}
                  title="Close"
                  type="button"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleAssignTeam} style={{ marginBottom: '16px', padding: '16px', borderRadius: '8px', backgroundColor: 'var(--light-gray)' }}>
                <label className="form-label">Assign to Team</label>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <select
                    className="form-input"
                    value={selectedTeamId}
                    onChange={(e) => setSelectedTeamId(e.target.value)}
                    style={{ flex: 1 }}
                  >
                    <option value="">Select a team...</option>
                    {getAvailableTeams().map(team => (
                      <option key={team.id} value={team.id}>{team.name}</option>
                    ))}
                  </select>
                  <button className="btn-primary" type="submit">
                    Assign
                  </button>
                </div>
              </form>

              <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #e5e7eb', textAlign: 'left' }}>
                      <th style={{ padding: '12px 16px', color: '#6b7280', fontSize: '0.875rem', fontWeight: 600 }}>Team</th>
                      <th style={{ padding: '12px 16px', color: '#6b7280', fontSize: '0.875rem', fontWeight: 600 }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(!selectedUser.teams || selectedUser.teams.length === 0) ? (
                      <tr>
                        <td colSpan="2" style={{ padding: '24px', textAlign: 'center', color: '#6b7280' }}>
                          User is not assigned to any teams.
                        </td>
                      </tr>
                    ) : (
                      selectedUser.teams.map((team) => (
                        <tr key={team.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                          <td style={{ padding: '12px 16px', color: '#111827' }}>{team.name}</td>
                          <td style={{ padding: '12px 16px' }}>
                            <button
                              onClick={() => handleRemoveTeam(team.id)}
                              className="btn-secondary"
                              type="button"
                            >
                              Remove
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ManageUsersPage;
