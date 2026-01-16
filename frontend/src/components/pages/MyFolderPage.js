import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Plus } from 'lucide-react';
import Sidebar from '../shared/Sidebar';
import { api } from '../../services/api';

const MyFolderPage = () => {
  const navigate = useNavigate();
  const [prompts, setPrompts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [organizationId, setOrganizationId] = useState(null);

  useEffect(() => {
    const init = async () => {
      try {
        // Fetch User's Org (Simplification)
        await api.getCurrentUser();
        // Assuming we pick the first org or have a way to get current org context
        // For now, let's fetch orgs and pick first
        const orgs = await api.getOrganizations();
        if (orgs.length > 0) {
          setOrganizationId(orgs[0].id);
        }
      } catch (err) {
        console.error('Failed to init', err);
      }
    };
    init();
  }, []);

  useEffect(() => {
    const fetchData = async (page) => {
      setIsLoading(true);
      try {
        // Fetch Private Prompts
        // Requirement: Private prompts, created by me, sorted alphabetically
        const promptsData = await api.getPrompts({
          organization_id: organizationId,
          visibility: 'PRIVATE',
          created_by: 'me',
          ordering: 'name',
          page: page,
          page_size: 10
        });

        console.log('Prompts data:', promptsData);

        if (promptsData.results) {
          setPrompts(promptsData.results);
          setTotalPages(Math.ceil(promptsData.count / 10));
        } else {
           // Fallback if pagination not active or different structure
           setPrompts(promptsData);
        }

      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load prompts.');
      } finally {
        setIsLoading(false);
      }
    };

    if (organizationId) {
      fetchData(currentPage);
    }
  }, [organizationId, currentPage]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
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
            <h1 className="page-title">My Private Folder</h1>
            <p className="text-secondary">Manage your private prompts</p>
          </div>
          <button
            className="btn-primary"
            onClick={() => navigate('/dashboard/create-prompt')}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Plus size={18} /> New Prompt
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
                    <th style={{ padding: '12px 16px', color: '#6b7280', fontSize: '0.875rem', fontWeight: 600 }}>Model</th>
                    <th style={{ padding: '12px 16px', color: '#6b7280', fontSize: '0.875rem', fontWeight: 600 }}>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {prompts.length === 0 ? (
                    <tr>
                      <td colSpan="4" style={{ padding: '24px', textAlign: 'center', color: '#6b7280' }}>
                        No private prompts found. Create one to get started!
                      </td>
                    </tr>
                  ) : (
                    prompts.map(prompt => (
                      <tr key={prompt.id} style={{ borderBottom: '1px solid #f3f4f6', cursor: 'pointer' }} onClick={() => console.log('View prompt', prompt.id)}>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <FileText size={16} className="text-primary" />
                            <span style={{ fontWeight: 500, color: '#111827' }}>{prompt.name}</span>
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px', color: '#4b5563', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {prompt.description || '-'}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            backgroundColor: '#eff6ff',
                            color: '#2563eb',
                            fontSize: '0.75rem',
                            fontWeight: 500
                          }}>
                            {prompt.model}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', color: '#6b7280', fontSize: '0.875rem' }}>
                          {formatDate(prompt.created_at)}
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
                  onClick={() => handlePageChange(currentPage - 1)}
                >
                  Previous
                </button>
                <span style={{ fontSize: '0.875rem', color: '#4b5563' }}>
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  className="btn-secondary"
                  disabled={currentPage === totalPages}
                  onClick={() => handlePageChange(currentPage + 1)}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default MyFolderPage;
