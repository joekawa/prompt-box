import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Folder, Plus, Trash2, FolderPlus, ArrowRight } from 'lucide-react';
import Sidebar from '../shared/Sidebar';
import { api } from '../../services/api';

const PublicFolderPage = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [organizationId, setOrganizationId] = useState(null);
  const [currentFolderId, setCurrentFolderId] = useState(null); // null means root
  const [folderBreadcrumbs, setFolderBreadcrumbs] = useState([]);
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  // Move functionality state
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [itemToMove, setItemToMove] = useState(null);
  const [targetFolderId, setTargetFolderId] = useState('');
  const [allFolders, setAllFolders] = useState([]);

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
      }
    };
    init();
  }, []);

  const fetchData = useCallback(async () => {
    if (!organizationId) return;

    setIsLoading(true);
    try {
      // 1. Fetch Folders
      const folderParams = {
        organization_id: organizationId,
        type: 'PUBLIC',
        parent_id: currentFolderId || '', // Filter by parent
      };
      if (!currentFolderId) {
        folderParams.root_only = 'true';
      }

      const folders = await api.getFolders(folderParams);

      // 2. Fetch Prompts
      const promptParams = {
        organization_id: organizationId,
        visibility: 'PUBLIC',
        folder_id: currentFolderId || 'root', // Filter by folder
        ordering: 'name',
        page: currentPage,
        page_size: 10
      };

      const promptsData = await api.getPrompts(promptParams);

      let promptResults = [];
      let totalPrompts = 0;

      if (promptsData.results) {
        promptResults = promptsData.results;
        totalPrompts = promptsData.count;
        setTotalPages(Math.ceil(totalPrompts / 10));
      } else {
        promptResults = promptsData;
        totalPrompts = promptsData.length;
        setTotalPages(1);
      }

      const combinedItems = [
        ...folders.map(f => ({ ...f, type: 'folder' })),
        ...promptResults.map(p => ({ ...p, type: 'prompt' }))
      ];

      setItems(combinedItems);

    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load public folder.');
    } finally {
      setIsLoading(false);
    }
  }, [organizationId, currentFolderId, currentPage]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateFolder = async () => {
    if (!newFolderName.trim() || !organizationId) return;
    try {
        await api.createFolder({
            name: newFolderName,
            organization: organizationId,
            type: 'PUBLIC',
            parent: currentFolderId
        });
        setNewFolderName('');
        setShowCreateFolderModal(false);
        fetchData();
    } catch (err) {
        console.error('Failed to create folder', err);
        alert('Failed to create folder');
    }
  };

  const fetchAllPublicFolders = async () => {
    if (!organizationId) return;
    try {
      // Fetch all public folders for the move dropdown
      // Note: In a real app with many folders, this should be optimized or use an async select
      const folders = await api.getFolders({
        organization_id: organizationId,
        type: 'PUBLIC'
      });
      setAllFolders(folders);
    } catch (err) {
      console.error('Failed to fetch all folders', err);
    }
  };

  const openMoveModal = (item) => {
    setItemToMove(item);
    setTargetFolderId(''); // Default to select...
    fetchAllPublicFolders();
    setShowMoveModal(true);
  };

  const handleMove = async () => {
    if (!itemToMove) return;
    try {
      const folderId = targetFolderId === 'root' ? null : targetFolderId;

      if (itemToMove.type === 'folder') {
        // Prevent moving a folder into itself or its children (basic check: not into itself)
        if (folderId === itemToMove.id) {
            alert("Cannot move a folder into itself.");
            return;
        }
        await api.updateFolder(itemToMove.id, { parent: folderId });
      } else {
        await api.updatePrompt(itemToMove.id, { folder: folderId });
      }

      setShowMoveModal(false);
      setItemToMove(null);
      fetchData();
    } catch (err) {
      console.error('Move failed', err);
      alert('Move failed');
    }
  };

  const handleDelete = async (item) => {
      if (!window.confirm(`Are you sure you want to delete ${item.name}?`)) return;
      try {
          if (item.type === 'folder') {
              await api.deleteFolder(item.id);
          } else {
              await api.deletePrompt(item.id);
          }
          fetchData();
      } catch (err) {
          console.error('Delete failed', err);
          alert('Delete failed');
      }
  };

  const handleFolderClick = (folder) => {
      setCurrentFolderId(folder.id);
      setFolderBreadcrumbs([...folderBreadcrumbs, folder]);
      setCurrentPage(1);
  };

  const handleBreadcrumbClick = (index) => {
      if (index === -1) {
          setCurrentFolderId(null);
          setFolderBreadcrumbs([]);
      } else {
          const newBreadcrumbs = folderBreadcrumbs.slice(0, index + 1);
          setCurrentFolderId(newBreadcrumbs[newBreadcrumbs.length - 1].id);
          setFolderBreadcrumbs(newBreadcrumbs);
      }
      setCurrentPage(1);
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', width: '100%' }}>
          <div>
            <h1 className="page-title" style={{ marginBottom: '8px' }}>Public Folder</h1>
            <p className="text-secondary">Explore prompts shared by your organization</p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
                className="btn-secondary"
                onClick={() => setShowCreateFolderModal(true)}
            >
                <FolderPlus size={18} /> New Folder
            </button>
            <button
                className="btn-primary"
                onClick={() => navigate('/dashboard/create-prompt')}
            >
                <Plus size={18} /> New Prompt
            </button>
          </div>
        </div>

        {/* Breadcrumbs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', fontSize: '0.9rem', color: '#4b5563', width: '100%' }}>
            <span
                style={{ cursor: 'pointer', fontWeight: currentFolderId === null ? 600 : 400 }}
                onClick={() => handleBreadcrumbClick(-1)}
            >
                Root
            </span>
            {folderBreadcrumbs.map((folder, index) => (
                <React.Fragment key={folder.id}>
                    <span>/</span>
                    <span
                        style={{ cursor: 'pointer', fontWeight: index === folderBreadcrumbs.length - 1 ? 600 : 400 }}
                        onClick={() => handleBreadcrumbClick(index)}
                    >
                        {folder.name}
                    </span>
                </React.Fragment>
            ))}
        </div>

        {error && (
          <div className="error-message" style={{ marginBottom: '20px' }}>
            {error}
          </div>
        )}

        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px', width: '100%' }}>
            <p>Loading...</p>
          </div>
        ) : (
          <div className="content-card" style={{ width: '100%' }}>
            <div className="table-container">
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e5e7eb', textAlign: 'left' }}>
                    <th style={{ padding: '12px 16px', color: '#6b7280', fontSize: '0.875rem', fontWeight: 600 }}>Name</th>
                    <th style={{ padding: '12px 16px', color: '#6b7280', fontSize: '0.875rem', fontWeight: 600 }}>Description</th>
                    <th style={{ padding: '12px 16px', color: '#6b7280', fontSize: '0.875rem', fontWeight: 600 }}>Model</th>
                    <th style={{ padding: '12px 16px', color: '#6b7280', fontSize: '0.875rem', fontWeight: 600 }}>Created</th>
                    <th style={{ padding: '12px 16px', color: '#6b7280', fontSize: '0.875rem', fontWeight: 600 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ padding: '24px', textAlign: 'center', color: '#6b7280' }}>
                        No public prompts or folders found.
                      </td>
                    </tr>
                  ) : (
                    items.map(item => (
                      <tr key={`${item.type}-${item.id}`} style={{ borderBottom: '1px solid #f3f4f6', cursor: 'pointer' }}
                        onClick={() => item.type === 'folder' ? handleFolderClick(item) : console.log('View prompt', item.id)}
                      >
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {item.type === 'folder' ? (
                                <Folder size={16} className="text-secondary" />
                            ) : (
                                <FileText size={16} className="text-primary" />
                            )}
                            <span style={{ fontWeight: 500, color: '#111827' }}>{item.name}</span>
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px', color: '#4b5563', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.description || '-'}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                            {item.type === 'prompt' && (
                                <span style={{
                                    display: 'inline-block',
                                    padding: '2px 8px',
                                    borderRadius: '12px',
                                    backgroundColor: '#eff6ff',
                                    color: '#2563eb',
                                    fontSize: '0.75rem',
                                    fontWeight: 500
                                }}>
                                    {item.model}
                                </span>
                            )}
                        </td>
                        <td style={{ padding: '12px 16px', color: '#6b7280', fontSize: '0.875rem' }}>
                          {formatDate(item.created_at)}
                        </td>
                         <td style={{ padding: '12px 16px' }}>
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button
                                  onClick={(e) => { e.stopPropagation(); openMoveModal(item); }}
                                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}
                                  title="Move"
                              >
                                  <ArrowRight size={16} />
                              </button>
                              <button
                                  onClick={(e) => { e.stopPropagation(); handleDelete(item); }}
                                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}
                                  title="Delete"
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

      {/* Create Folder Modal */}
      {showCreateFolderModal && (
          <div style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
          }}>
              <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '8px', width: '400px' }}>
                  <h3 style={{ marginTop: 0 }}>Create New Folder</h3>
                  <div style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', fontWeight: 500 }}>Folder Name</label>
                      <input
                          type="text"
                          value={newFolderName}
                          onChange={(e) => setNewFolderName(e.target.value)}
                          style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }}
                          placeholder="e.g., Marketing Prompts"
                      />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                      <button className="btn-secondary" onClick={() => setShowCreateFolderModal(false)}>Cancel</button>
                      <button className="btn-primary" onClick={handleCreateFolder}>Create</button>
                  </div>
              </div>
          </div>
      )}

      {/* Move Modal */}
      {showMoveModal && (
          <div style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
          }}>
              <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '8px', width: '400px' }}>
                  <h3 style={{ marginTop: 0 }}>Move {itemToMove?.type === 'folder' ? 'Folder' : 'Prompt'}</h3>
                  <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>Select destination folder for "{itemToMove?.name}"</p>

                  <div style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem', fontWeight: 500 }}>Destination</label>
                      <select
                          value={targetFolderId}
                          onChange={(e) => setTargetFolderId(e.target.value)}
                          style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d1d5db' }}
                      >
                          <option value="">Select Folder...</option>
                          <option value="root">Root Folder</option>
                          {allFolders
                            .filter(f => f.id !== itemToMove?.id) // Don't move folder into itself
                            .map(folder => (
                              <option key={folder.id} value={folder.id}>{folder.name}</option>
                          ))}
                      </select>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                      <button className="btn-secondary" onClick={() => setShowMoveModal(false)}>Cancel</button>
                      <button className="btn-primary" onClick={handleMove} disabled={!targetFolderId}>Move</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default PublicFolderPage;
