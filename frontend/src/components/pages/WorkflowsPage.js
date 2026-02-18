import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, AlertCircle, GitBranch } from 'lucide-react';
import Sidebar from '../shared/Sidebar';
import { api } from '../../services/api';

const WorkflowsPage = () => {
  const navigate = useNavigate();
  const [workflows, setWorkflows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');

  const fetchWorkflows = useCallback(async (currentPage, searchTerm) => {
    setIsLoading(true);
    try {
      const params = { page: currentPage, page_size: 10 };
      if (searchTerm) params.search = searchTerm;
      const data = await api.getWorkflows(params);
      if (data.results) {
        setWorkflows(data.results);
        setTotalPages(Math.ceil(data.count / 10));
      } else {
        setWorkflows(data);
        setTotalPages(1);
      }
    } catch (err) {
      console.error('Error fetching workflows:', err);
      setError('Failed to load workflows.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWorkflows(page, search);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, fetchWorkflows]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchWorkflows(1, search);
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this workflow?')) return;
    try {
      await api.deleteWorkflow(id);
      fetchWorkflows(page, search);
    } catch (err) {
      setError('Failed to delete workflow.');
    }
  };

  const visibilityBadge = (visibility) => {
    const styles = {
      PRIVATE: { background: '#f3f4f6', color: '#374151' },
      TEAM: { background: '#ede9fe', color: '#5b21b6' },
      PUBLIC: { background: '#d1fae5', color: '#065f46' },
    };
    const s = styles[visibility] || styles.PRIVATE;
    return (
      <span style={{
        ...s,
        padding: '2px 8px',
        borderRadius: '12px',
        fontSize: '0.75rem',
        fontWeight: 600,
      }}>
        {visibility}
      </span>
    );
  };

  return (
    <div className="dashboard-container">
      <Sidebar />
      <main className="main-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h1 className="page-title" style={{ margin: 0 }}>Workflows</h1>
          <button
            className="btn-primary"
            onClick={() => navigate('/dashboard/workflows/create')}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Plus size={18} />
            New Workflow
          </button>
        </div>

        {error && (
          <div className="error-message" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        <form onSubmit={handleSearch} style={{ marginBottom: '16px', display: 'flex', gap: '8px' }}>
          <input
            type="text"
            className="form-input"
            placeholder="Search workflows..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ maxWidth: '320px' }}
          />
          <button type="submit" className="btn-secondary">Search</button>
        </form>

        <div style={{ background: 'white', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', color: '#6b7280', fontSize: '0.875rem', fontWeight: 600 }}>Name</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', color: '#6b7280', fontSize: '0.875rem', fontWeight: 600 }}>Description</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', color: '#6b7280', fontSize: '0.875rem', fontWeight: 600 }}>Visibility</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', color: '#6b7280', fontSize: '0.875rem', fontWeight: 600 }}>Steps</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', color: '#6b7280', fontSize: '0.875rem', fontWeight: 600 }}>Created By</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', color: '#6b7280', fontSize: '0.875rem', fontWeight: 600 }}></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="6" style={{ padding: '32px', textAlign: 'center', color: '#6b7280' }}>Loading...</td>
                </tr>
              ) : workflows.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ padding: '32px', textAlign: 'center', color: '#6b7280' }}>
                    No workflows found. Create one to get started.
                  </td>
                </tr>
              ) : (
                workflows.map(workflow => (
                  <tr
                    key={workflow.id}
                    style={{ borderBottom: '1px solid #f3f4f6', cursor: 'pointer' }}
                    onClick={() => navigate(`/dashboard/workflows/${workflow.id}`)}
                  >
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <GitBranch size={16} className="text-primary" />
                        <span style={{ fontWeight: 500, color: '#111827' }}>{workflow.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', color: '#4b5563', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {workflow.description || '-'}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {visibilityBadge(workflow.visibility)}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#4b5563', fontSize: '0.875rem' }}>
                      {workflow.step_count}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#4b5563', fontSize: '0.875rem' }}>
                      {workflow.created_by_name || '-'}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <button
                        className="btn-secondary"
                        style={{ fontSize: '0.75rem', padding: '4px 10px', color: '#dc2626', borderColor: '#dc2626' }}
                        onClick={(e) => handleDelete(e, workflow.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginTop: '16px' }}>
            <button className="btn-secondary" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</button>
            <span style={{ fontSize: '0.875rem', color: '#4b5563' }}>Page {page} of {totalPages}</span>
            <button className="btn-secondary" disabled={page === totalPages} onClick={() => setPage(page + 1)}>Next</button>
          </div>
        )}
      </main>
    </div>
  );
};

export default WorkflowsPage;
