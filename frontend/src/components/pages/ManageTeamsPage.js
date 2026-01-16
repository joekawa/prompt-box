import React, { useState, useEffect, useCallback } from 'react';
import { Users, Plus, Trash2, Edit2, UserPlus, X } from 'lucide-react';
import Sidebar from '../shared/Sidebar';
import { api } from '../../services/api';

const ManageTeamsPage = () => {
  const [teams, setTeams] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [organizationId, setOrganizationId] = useState(null);

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);

  // Form/Selection state
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [teamFormName, setTeamFormName] = useState('');
  const [teamFormDescription, setTeamFormDescription] = useState('');

  // Members management state
  const [teamMembers, setTeamMembers] = useState([]);
  const [orgMembers, setOrgMembers] = useState([]);
  const [selectedUserIdToAdd, setSelectedUserIdToAdd] = useState('');
  const [roleToAdd, setRoleToAdd] = useState('MEMBER');

  useEffect(() => {
    const init = async () => {
      try {
        await api.getCurrentUser();
        const orgs = await api.getOrganizations();
        if (orgs.length > 0) {
          setOrganizationId(orgs[0].id);
        }
      } catch (err) {
        console.error('Failed to init', err);
        setError('Failed to load organization data.');
      }
    };
    init();
  }, []);

  const fetchTeams = useCallback(async () => {
    if (!organizationId) return;

    setIsLoading(true);
    try {
      const params = {
        organization_id: organizationId,
        ordering: 'name',
        page: currentPage,
        page_size: 10
      };

      const data = await api.getTeams(params);

      if (data.results) {
        setTeams(data.results);
        setTotalPages(Math.ceil(data.count / 10));
      } else {
        setTeams(data);
        setTotalPages(1);
      }
    } catch (err) {
      console.error('Failed to fetch teams', err);
      setError('Failed to load teams.');
    } finally {
      setIsLoading(false);
    }
  }, [organizationId, currentPage]);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  // --- CRUD Operations ---

  const handleCreateTeam = async () => {
    if (!teamFormName.trim() || !organizationId) return;
    try {
      await api.createTeam({
        organization: organizationId,
        name: teamFormName,
        description: teamFormDescription
      });
      setShowCreateModal(false);
      setTeamFormName('');
      setTeamFormDescription('');
      fetchTeams();
    } catch (err) {
      console.error('Failed to create team', err);
      alert('Failed to create team');
    }
  };

  const handleUpdateTeam = async () => {
    if (!selectedTeam || !teamFormName.trim()) return;
    try {
      await api.updateTeam(selectedTeam.id, {
        name: teamFormName,
        description: teamFormDescription
      });
      setShowEditModal(false);
      setSelectedTeam(null);
      fetchTeams();
    } catch (err) {
      console.error('Failed to update team', err);
      alert('Failed to update team');
    }
  };

  const handleDeleteTeam = async (team) => {
    if (!window.confirm(`Are you sure you want to delete team "${team.name}"?`)) return;
    try {
      await api.deleteTeam(team.id);
      fetchTeams();
    } catch (err) {
      console.error('Failed to delete team', err);
      alert('Failed to delete team');
    }
  };

  // --- Member Management ---

  const openMembersModal = async (team) => {
    setSelectedTeam(team);
    setShowMembersModal(true);
    // Load team members
    try {
        const members = await api.getTeamMembers(team.id);
        setTeamMembers(members);
    } catch (err) {
        console.error('Failed to load team members', err);
        alert('Failed to load team members');
    }

    // Load org members for adding new people
    try {
        const members = await api.getOrganizationMembers(organizationId);
        setOrgMembers(members);
    } catch (err) {
        console.error('Failed to load organization members', err);
    }
  };

  const handleAddMember = async () => {
    if (!selectedTeam || !selectedUserIdToAdd) return;
    try {
        await api.addTeamMember(selectedTeam.id, selectedUserIdToAdd, roleToAdd);
        // Refresh members list
        const members = await api.getTeamMembers(selectedTeam.id);
        setTeamMembers(members);
        setSelectedUserIdToAdd('');
    } catch (err) {
        console.error('Failed to add member', err);
        alert(err.message || 'Failed to add member');
    }
  };

  const handleRemoveMember = async (userId) => {
      if (!window.confirm('Are you sure you want to remove this user from the team?')) return;
      try {
          await api.removeTeamMember(selectedTeam.id, userId);
          // Refresh members list
          const members = await api.getTeamMembers(selectedTeam.id);
          setTeamMembers(members);
      } catch (err) {
          console.error('Failed to remove member', err);
          alert('Failed to remove member');
      }
  };

  const openEditModal = (team) => {
      setSelectedTeam(team);
      setTeamFormName(team.name);
      setTeamFormDescription(team.description);
      setShowEditModal(true);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="dashboard-container">
      <Sidebar />
      <main className="main-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1 className="page-title">Manage Teams</h1>
            <p className="text-secondary">Create and manage teams within your organization</p>
          </div>
          <button
            className="btn-primary"
            onClick={() => {
                setTeamFormName('');
                setTeamFormDescription('');
                setShowCreateModal(true);
            }}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Plus size={18} /> Create Team
          </button>
        </div>

        {error && (
          <div className="error-message" style={{ marginBottom: '20px' }}>
            {error}
          </div>
        )}

        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
            <p>Loading...</p>
          </div>
        ) : (
          <div className="content-card">
            <div className="table-container">
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e5e7eb', textAlign: 'left' }}>
                    <th style={{ padding: '12px 16px', color: '#6b7280', fontSize: '0.875rem', fontWeight: 600 }}>Name</th>
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
                    teams.map(team => (
                      <tr key={team.id} style={{ borderBottom: '1px solid #f3f4f6', cursor: 'pointer' }}
                        onClick={() => openMembersModal(team)}
                        title="Click to manage members"
                      >
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Users size={16} className="text-primary" />
                            <span style={{ fontWeight: 500, color: '#111827' }}>{team.name}</span>
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px', color: '#4b5563', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {team.description || '-'}
                        </td>
                        <td style={{ padding: '12px 16px', color: '#6b7280', fontSize: '0.875rem' }}>
                          {formatDate(team.created_at)}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button
                                  onClick={(e) => { e.stopPropagation(); openEditModal(team); }}
                                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}
                                  title="Edit Team"
                              >
                                  <Edit2 size={16} />
                              </button>
                              <button
                                  onClick={(e) => { e.stopPropagation(); handleDeleteTeam(team); }}
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
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                >
                  Previous
                </button>
                <span style={{ fontSize: '0.875rem', color: '#4b5563' }}>
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  className="btn-secondary"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(currentPage + 1)}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Create Team Modal */}
      {showCreateModal && (
        <div className="modal-overlay" style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
            <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '8px', width: '400px' }}>
                <h3 style={{ marginTop: 0 }}>Create New Team</h3>
                <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', fontWeight: 500 }}>Team Name</label>
                    <input
                        type="text"
                        value={teamFormName}
                        onChange={(e) => setTeamFormName(e.target.value)}
                        style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }}
                        placeholder="e.g., Engineering"
                    />
                </div>
                <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', fontWeight: 500 }}>Description</label>
                    <textarea
                        value={teamFormDescription}
                        onChange={(e) => setTeamFormDescription(e.target.value)}
                        style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db', minHeight: '80px' }}
                        placeholder="Optional description"
                    />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                    <button className="btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
                    <button className="btn-primary" onClick={handleCreateTeam}>Create</button>
                </div>
            </div>
        </div>
      )}

      {/* Edit Team Modal */}
      {showEditModal && (
        <div className="modal-overlay" style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
            <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '8px', width: '400px' }}>
                <h3 style={{ marginTop: 0 }}>Edit Team</h3>
                <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', fontWeight: 500 }}>Team Name</label>
                    <input
                        type="text"
                        value={teamFormName}
                        onChange={(e) => setTeamFormName(e.target.value)}
                        style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }}
                    />
                </div>
                <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', fontWeight: 500 }}>Description</label>
                    <textarea
                        value={teamFormDescription}
                        onChange={(e) => setTeamFormDescription(e.target.value)}
                        style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db', minHeight: '80px' }}
                    />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                    <button className="btn-secondary" onClick={() => setShowEditModal(false)}>Cancel</button>
                    <button className="btn-primary" onClick={handleUpdateTeam}>Update</button>
                </div>
            </div>
        </div>
      )}

      {/* Manage Members Modal */}
      {showMembersModal && selectedTeam && (
          <div className="modal-overlay" style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
            <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '8px', width: '600px', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3 style={{ margin: 0 }}>Manage Members - {selectedTeam.name}</h3>
                    <button onClick={() => setShowMembersModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                        <X size={20} />
                    </button>
                </div>

                {/* Add Member Section */}
                <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid #e5e7eb' }}>
                    <select
                        value={selectedUserIdToAdd}
                        onChange={(e) => setSelectedUserIdToAdd(e.target.value)}
                        style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }}
                    >
                        <option value="">Select user to add...</option>
                        {orgMembers
                            .filter(om => !teamMembers.some(tm => tm.user === om.user)) // Filter out existing team members
                            .map(om => (
                                <option key={om.id} value={om.user}>{om.user_name} ({om.user_email})</option>
                        ))}
                    </select>
                    <select
                        value={roleToAdd}
                        onChange={(e) => setRoleToAdd(e.target.value)}
                        style={{ width: '120px', padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }}
                    >
                        <option value="MEMBER">Member</option>
                        <option value="OWNER">Owner</option>
                        <option value="VIEWER">Viewer</option>
                    </select>
                    <button className="btn-primary" onClick={handleAddMember} disabled={!selectedUserIdToAdd}>
                        <UserPlus size={18} /> Add
                    </button>
                </div>

                {/* Members List */}
                <div style={{ overflowY: 'auto', flex: 1 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead style={{ position: 'sticky', top: 0, backgroundColor: 'white' }}>
                            <tr style={{ borderBottom: '1px solid #e5e7eb', textAlign: 'left' }}>
                                <th style={{ padding: '8px', fontSize: '0.875rem' }}>Name</th>
                                <th style={{ padding: '8px', fontSize: '0.875rem' }}>Email</th>
                                <th style={{ padding: '8px', fontSize: '0.875rem' }}>Role</th>
                                <th style={{ padding: '8px', fontSize: '0.875rem' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {teamMembers.length === 0 ? (
                                <tr>
                                    <td colSpan="4" style={{ padding: '16px', textAlign: 'center', color: '#6b7280' }}>
                                        No members in this team.
                                    </td>
                                </tr>
                            ) : (
                                teamMembers.map(member => (
                                    <tr key={member.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                        <td style={{ padding: '8px' }}>{member.user_name}</td>
                                        <td style={{ padding: '8px', color: '#6b7280' }}>{member.user_email}</td>
                                        <td style={{ padding: '8px' }}>
                                            <span style={{
                                                fontSize: '0.75rem', padding: '2px 8px', borderRadius: '12px',
                                                backgroundColor: member.role === 'OWNER' ? '#dbeafe' : '#f3f4f6',
                                                color: member.role === 'OWNER' ? '#1e40af' : '#374151'
                                            }}>
                                                {member.role}
                                            </span>
                                        </td>
                                        <td style={{ padding: '8px' }}>
                                            <button
                                                onClick={() => handleRemoveMember(member.user)}
                                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}
                                                title="Remove Member"
                                            >
                                                <Trash2 size={16} />
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
    </div>
  );
};

export default ManageTeamsPage;
