import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api';
import { PlusCircle, Edit2, Trash2, Users, X, UserPlus } from 'lucide-react';
import Sidebar from '../shared/Sidebar';

const ManageTeamsPage = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);

  // Form states
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [memberEmail, setMemberEmail] = useState('');

  const fetchTeams = useCallback(async () => {
    setLoading(true);
    try {
      // Assuming the API supports page query param
      const data = await api.getTeams({ page });
      setTeams(data.results);
      setTotalPages(Math.ceil(data.count / 10)); // Assuming 10 per page
      setError(null);
    } catch (err) {
      setError('Failed to load teams.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  const fetchTeamMembers = async (teamId) => {
      try {
          const members = await api.getTeamMembers(teamId);
          setTeamMembers(members);
      } catch (err) {
          console.error("Failed to load members", err);
          // show error toast?
      }
  };

  // --- Team CRUD ---

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    try {
      // We need organization ID. Assuming we use the first org of the current user for now
      // or the backend handles it. The backend requires organization in the body.
      // Let's fetch orgs first if we don't have one? Or the user context should have it.
      // For now, let's assume we fetch orgs and pick the first one.
      const orgs = await api.getOrganizations();
      if (orgs.length === 0) throw new Error("No organization found");
      const orgId = orgs[0].id;

      await api.createTeam({ ...formData, organization: orgId });
      setShowCreateModal(false);
      setFormData({ name: '', description: '' });
      fetchTeams();
    } catch (err) {
      alert('Failed to create team: ' + err.message);
    }
  };

  const handleUpdateTeam = async (e) => {
    e.preventDefault();
    try {
      await api.updateTeam(editingTeam.id, formData);
      setEditingTeam(null);
      setFormData({ name: '', description: '' });
      fetchTeams();
    } catch (err) {
      alert('Failed to update team: ' + err.message);
    }
  };

  const handleDeleteTeam = async (id) => {
    if (!window.confirm('Are you sure you want to delete this team?')) return;
    try {
      await api.deleteTeam(id);
      fetchTeams();
    } catch (err) {
      alert('Failed to delete team: ' + err.message);
    }
  };

  const openEditModal = (team) => {
    setEditingTeam(team);
    setFormData({ name: team.name, description: team.description });
    setShowCreateModal(true); // Reusing the modal
  };

  // --- Member Management ---

  const openMembersModal = (team) => {
      setSelectedTeam(team);
      fetchTeamMembers(team.id);
      setShowMembersModal(true);
  };

  const handleAddMember = async (e) => {
      e.preventDefault();
      try {
          // In a real app, we'd look up the user ID by email first or have a dropdown.
          // For now, let's assume we need to find the user in the org first.
          // This part is tricky without an "All Users" endpoint that returns IDs by email.
          // Let's fetch org members to find the ID.
          const orgs = await api.getOrganizations();
          if (orgs.length === 0) throw new Error("No organization found");

          // This is inefficient but necessary without a search endpoint
          // In a real implementation we should have a user search endpoint
          // For this MVP, we will try to find the user in the org members list.
          // Actually, let's just use the `add_member` endpoint logic.
          // The backend `add_member` expects `user_id`.
          // We can't send email. We need to find the user ID.
          // Workaround: Fetch org members, find user by email.

          // NOTE: The `OrganizationViewSet` has a `members` action.
          // We can't access it easily via `api.js` currently without an org ID.
          // Let's assume we work on the first org.
          const orgId = orgs[0].id;
          const response = await fetch(`/api/organizations/${orgId}/members/`);
          if (!response.ok) throw new Error("Failed to fetch org members");
          const members = await response.json();

          const userToAdd = members.find(m => m.user_email === memberEmail);

          if (!userToAdd) {
              alert("User not found in organization.");
              return;
          }

          await api.addTeamMember(selectedTeam.id, userToAdd.user);
          setMemberEmail('');
          fetchTeamMembers(selectedTeam.id);
      } catch (err) {
          alert('Failed to add member: ' + err.message);
      }
  };

  const handleRemoveMember = async (userId) => {
      if(!window.confirm("Remove this user from the team?")) return;
      try {
          await api.removeTeamMember(selectedTeam.id, userId);
          fetchTeamMembers(selectedTeam.id);
      } catch (err) {
          alert('Failed to remove member: ' + err.message);
      }
  };


  return (
    <div className="dashboard-container">
      <Sidebar />
      <main className="main-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', width: '100%' }}>
          <div>
            <h1 className="page-title" style={{ marginBottom: '8px' }}>Manage Teams</h1>
            <p className="text-secondary">Create and manage teams within your organization.</p>
          </div>
          <button
            className="btn-primary"
            onClick={() => {
              setEditingTeam(null);
              setFormData({ name: '', description: '' });
              setShowCreateModal(true);
            }}
          >
            <PlusCircle size={18} /> New Team
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
                    <th style={{ padding: '12px 16px', color: '#6b7280', fontSize: '0.875rem', fontWeight: 600 }}>Team Name</th>
                    <th style={{ padding: '12px 16px', color: '#6b7280', fontSize: '0.875rem', fontWeight: 600 }}>Description</th>
                    <th style={{ padding: '12px 16px', color: '#6b7280', fontSize: '0.875rem', fontWeight: 600 }}>Created</th>
                    <th style={{ padding: '12px 16px', color: '#6b7280', fontSize: '0.875rem', fontWeight: 600 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {teams.length === 0 ? (
                    <tr>
                      <td colSpan="4" style={{ padding: '24px', textAlign: 'center', color: '#6b7280' }}>
                        No teams found. Create one to get started.
                      </td>
                    </tr>
                  ) : (
                    teams.map((team) => (
                      <tr key={team.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                        <td style={{ padding: '12px 16px', fontWeight: 500, color: '#111827' }}>{team.name}</td>
                        <td style={{ padding: '12px 16px', color: '#4b5563', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {team.description || '-'}
                        </td>
                        <td style={{ padding: '12px 16px', color: '#6b7280', fontSize: '0.875rem' }}>
                          {new Date(team.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              onClick={() => openMembersModal(team)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}
                              title="Manage Members"
                            >
                              <Users size={16} />
                            </button>
                            <button
                              onClick={() => openEditModal(team)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}
                              title="Edit Team"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteTeam(team.id)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}
                              title="Delete Team"
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

            {/* Pagination */}
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

      {/* Create/Edit Modal */}
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
              <h3 style={{ margin: 0 }}>{editingTeam ? 'Edit Team' : 'Create New Team'}</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}
                title="Close"
                type="button"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={editingTeam ? handleUpdateTeam : handleCreateTeam}>
              <div className="form-group">
                <label className="form-label">Team Name</label>
                <input
                  className="form-input"
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Engineering"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-input"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="What is this team for?"
                  rows="3"
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button className="btn-secondary" type="button" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button className="btn-primary" type="submit">
                  {editingTeam ? 'Save Changes' : 'Create Team'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Members Modal */}
      {showMembersModal && selectedTeam && (
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
              <h3 style={{ margin: 0 }}>Members: {selectedTeam.name}</h3>
              <button
                onClick={() => setShowMembersModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}
                title="Close"
                type="button"
              >
                <X size={20} />
              </button>
            </div>

            {/* Add Member Form */}
            <form onSubmit={handleAddMember} style={{ marginBottom: '16px', padding: '16px', borderRadius: '8px', backgroundColor: 'var(--light-gray)' }}>
              <label className="form-label">Add User by Email</label>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <input
                  className="form-input"
                  type="email"
                  required
                  value={memberEmail}
                  onChange={(e) => setMemberEmail(e.target.value)}
                  placeholder="user@example.com"
                />
                <button className="btn-primary" type="submit">
                  <UserPlus size={18} /> Add
                </button>
              </div>
              <span className="text-secondary">User must be a member of the organization first.</span>
            </form>

            {/* Member List */}
            <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e5e7eb', textAlign: 'left' }}>
                    <th style={{ padding: '12px 16px', color: '#6b7280', fontSize: '0.875rem', fontWeight: 600 }}>User</th>
                    <th style={{ padding: '12px 16px', color: '#6b7280', fontSize: '0.875rem', fontWeight: 600 }}>Role</th>
                    <th style={{ padding: '12px 16px', color: '#6b7280', fontSize: '0.875rem', fontWeight: 600 }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {teamMembers.length === 0 ? (
                    <tr>
                      <td colSpan="3" style={{ padding: '24px', textAlign: 'center', color: '#6b7280' }}>
                        No members in this team.
                      </td>
                    </tr>
                  ) : (
                    teamMembers.map((member) => (
                      <tr key={member.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                        <td style={{ padding: '12px 16px', color: '#111827' }}>
                          {member.user_name}
                          <br />
                          <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>{member.user_email}</span>
                        </td>
                        <td style={{ padding: '12px 16px', color: '#4b5563', fontSize: '0.875rem' }}>{member.role}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <button
                            onClick={() => handleRemoveMember(member.user)}
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

export default ManageTeamsPage;
