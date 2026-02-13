import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Save, AlertCircle, CheckCircle, Plus, Folder, Lock, Globe, ChevronDown, ChevronRight, RotateCcw } from 'lucide-react';
import Sidebar from '../shared/Sidebar';
import { api } from '../../services/api';

const ViewPromptPage = () => {
  const { id } = useParams();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    prompt: '',
    model: 'gpt-3.5-turbo',
    visibility: 'PRIVATE',
    category_ids: [],
    team_ids: []
  });

  const [categories, setCategories] = useState([]);
  const [teams, setTeams] = useState([]);
  const [privateFolders, setPrivateFolders] = useState([]);
  const [publicFolders, setPublicFolders] = useState([]);
  const [saveLocationType, setSaveLocationType] = useState('PRIVATE');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingPrompt, setIsLoadingPrompt] = useState(true);
  const [isLoadingFolders, setIsLoadingFolders] = useState(false);
  const [organizationId, setOrganizationId] = useState(null);

  // History state
  const [history, setHistory] = useState([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotalPages, setHistoryTotalPages] = useState(1);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [expandedHistoryId, setExpandedHistoryId] = useState(null);
  const [isReverting, setIsReverting] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchAllFolders = useCallback(async () => {
    setIsLoadingFolders(true);
    try {
      const [privateData, publicData] = await Promise.all([
        api.getFolders({ type: 'PRIVATE' }),
        api.getFolders({ type: 'PUBLIC' })
      ]);
      setPrivateFolders(privateData.results || privateData || []);
      setPublicFolders(publicData.results || publicData || []);
    } catch (err) {
      console.error('Error fetching folders:', err);
      setPrivateFolders([]);
      setPublicFolders([]);
    } finally {
      setIsLoadingFolders(false);
    }
  }, []);

  useEffect(() => {
    fetchAllFolders();
  }, [fetchAllFolders]);

  const fetchInitialData = async () => {
    try {
      const [catsData, teamsData, orgsData] = await Promise.all([
        api.getCategories(),
        api.getTeams(),
        api.getOrganizations()
      ]);

      setCategories(catsData);
      setTeams(teamsData.results || teamsData);

      if (orgsData && orgsData.length > 0) {
        setOrganizationId(orgsData[0].id);
      } else {
        setError('No organization found. Please contact an admin.');
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load initial data. Please ensure the backend is running.');
    }
  };

  // Fetch prompt data
  useEffect(() => {
    const fetchPrompt = async () => {
      setIsLoadingPrompt(true);
      try {
        const promptData = await api.getPrompt(id);

        const catIds = promptData.categories
          ? promptData.categories.map(c => c.category)
          : [];
        const teamIds = promptData.shared_teams
          ? promptData.shared_teams.map(t => t.team)
          : [];

        setFormData({
          name: promptData.name || '',
          description: promptData.description || '',
          prompt: promptData.prompt || '',
          model: promptData.model || 'gpt-3.5-turbo',
          visibility: promptData.visibility || 'PRIVATE',
          category_ids: catIds,
          team_ids: teamIds,
          folder: promptData.folder ? String(promptData.folder) : ''
        });

        // Determine save location type from folder
        if (promptData.folder) {
          // We'll check if the folder is public or private once folders load
          setSaveLocationType('PRIVATE'); // default, will be corrected below
        }
      } catch (err) {
        console.error('Error fetching prompt:', err);
        setError('Failed to load prompt details.');
      } finally {
        setIsLoadingPrompt(false);
      }
    };

    if (id) {
      fetchPrompt();
    }
  }, [id]);

  // Correct save location type once folders are loaded
  useEffect(() => {
    if (formData.folder && (privateFolders.length > 0 || publicFolders.length > 0)) {
      const isPublicFolder = publicFolders.some(f => String(f.id) === formData.folder);
      setSaveLocationType(isPublicFolder ? 'PUBLIC' : 'PRIVATE');
    }
  }, [formData.folder, privateFolders, publicFolders]);

  // Fetch history
  const fetchHistory = useCallback(async (page = 1) => {
    setIsLoadingHistory(true);
    try {
      const data = await api.getPromptHistory(id, { page, page_size: 10 });
      if (data.results) {
        setHistory(data.results);
        setHistoryTotalPages(Math.ceil(data.count / 10));
      } else {
        setHistory(data);
        setHistoryTotalPages(1);
      }
    } catch (err) {
      console.error('Error fetching history:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [id]);

  useEffect(() => {
    if (isHistoryOpen) {
      fetchHistory(historyPage);
    }
  }, [isHistoryOpen, historyPage, fetchHistory]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError('');
  };

  const handleCategoryChange = (e) => {
    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
    setFormData(prev => ({
      ...prev,
      category_ids: selectedOptions
    }));
  };

  const handleTeamChange = (e) => {
    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
    setFormData(prev => ({
      ...prev,
      team_ids: selectedOptions
    }));
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    if (!organizationId) {
      setError('Cannot create category: Organization ID missing');
      return;
    }

    try {
      const newCat = await api.createCategory({
        name: newCategoryName,
        organization: organizationId,
        description: 'Created via frontend'
      });
      setCategories(prev => [...prev, newCat]);
      setFormData(prev => ({
        ...prev,
        category_ids: [...prev.category_ids, newCat.id]
      }));
      setNewCategoryName('');
      setIsCreatingCategory(false);
    } catch (err) {
      console.error('Failed to create category:', err);
      setError('Failed to create category');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    if (!formData.name.trim()) {
      setError('Prompt Name is required');
      setIsLoading(false);
      return;
    }
    if (!formData.prompt.trim()) {
      setError('Prompt Content is required');
      setIsLoading(false);
      return;
    }
    if (formData.visibility === 'TEAM' && formData.team_ids.length === 0) {
      setError('Please select at least one team for Team visibility');
      setIsLoading(false);
      return;
    }

    try {
      const payload = { ...formData };

      if (payload.visibility === 'PRIVATE') {
        payload.team_ids = [];
      }

      await api.updatePrompt(id, payload);
      setSuccess('Prompt updated successfully!');

      // Refresh history if open
      if (isHistoryOpen) {
        fetchHistory(historyPage);
      }
    } catch (err) {
      console.error('Submission error:', err);
      setError(err.message || 'Failed to update prompt');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevert = async (historyId) => {
    if (!window.confirm('Are you sure you want to revert to this version?')) return;
    setIsReverting(true);
    try {
      const updatedPrompt = await api.revertPrompt(id, historyId);

      const catIds = updatedPrompt.categories
        ? updatedPrompt.categories.map(c => c.category)
        : [];
      const teamIds = updatedPrompt.shared_teams
        ? updatedPrompt.shared_teams.map(t => t.team)
        : [];

      setFormData({
        name: updatedPrompt.name || '',
        description: updatedPrompt.description || '',
        prompt: updatedPrompt.prompt || '',
        model: updatedPrompt.model || 'gpt-3.5-turbo',
        visibility: updatedPrompt.visibility || 'PRIVATE',
        category_ids: catIds,
        team_ids: teamIds,
        folder: updatedPrompt.folder ? String(updatedPrompt.folder) : ''
      });

      setSuccess('Prompt reverted successfully!');
      setExpandedHistoryId(null);
      fetchHistory(historyPage);
    } catch (err) {
      console.error('Revert error:', err);
      setError(err.message || 'Failed to revert prompt');
    } finally {
      setIsReverting(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoadingPrompt) {
    return (
      <div className="dashboard-container">
        <Sidebar />
        <main className="main-content">
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
            <p>Loading prompt...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <Sidebar />
      <main className="main-content">
        <h1 className="page-title">Edit Prompt</h1>

        {error && (
          <div className="error-message" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={20} />
            {error}
          </div>
        )}

        {success && (
          <div className="success-message" style={{
            backgroundColor: '#ecfdf5',
            color: '#059669',
            padding: '12px',
            borderRadius: '6px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <CheckCircle size={20} />
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="create-prompt-form" style={{ maxWidth: '800px', background: 'white', padding: '24px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>

          {/* Prompt Name */}
          <div className="form-group">
            <label className="form-label" htmlFor="name">Prompt Name <span style={{color: 'red'}}>*</span></label>
            <input
              type="text"
              id="name"
              name="name"
              className="form-input"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., Q3 Marketing Strategy Generator"
              required
            />
          </div>

          {/* Description */}
          <div className="form-group">
            <label className="form-label" htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              className="form-input"
              value={formData.description}
              onChange={handleChange}
              placeholder="Brief description of what this prompt does..."
              rows={3}
              style={{ resize: 'vertical' }}
            />
          </div>

          {/* Prompt Content */}
          <div className="form-group">
            <label className="form-label" htmlFor="prompt">Prompt Content <span style={{color: 'red'}}>*</span></label>
            <textarea
              id="prompt"
              name="prompt"
              className="form-input"
              value={formData.prompt}
              onChange={handleChange}
              placeholder="Enter your prompt template here..."
              rows={6}
              required
              style={{ fontFamily: 'monospace' }}
            />
          </div>

          {/* AI Model */}
          <div className="form-group">
            <label className="form-label" htmlFor="model">AI Model</label>
            <select
              id="model"
              name="model"
              className="form-input"
              value={formData.model}
              onChange={handleChange}
            >
              <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
              <option value="gpt-4">GPT-4</option>
              <option value="claude-2">Claude 2</option>
              <option value="llama-2">Llama 2</option>
            </select>
          </div>

          {/* Categories */}
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label className="form-label" style={{marginBottom: 0}}>Categories</label>
              <button
                type="button"
                className="btn-text"
                onClick={() => setIsCreatingCategory(!isCreatingCategory)}
                style={{ fontSize: '0.875rem' }}
              >
                <Plus size={14} /> {isCreatingCategory ? 'Cancel' : 'New Category'}
              </button>
            </div>

            {isCreatingCategory && (
              <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="New Category Name"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                />
                <button type="button" className="btn-secondary" onClick={handleCreateCategory}>Add</button>
              </div>
            )}

            <select
              multiple
              className="form-input"
              value={formData.category_ids}
              onChange={handleCategoryChange}
              style={{ height: '100px' }}
            >
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            <small className="text-secondary">Hold Ctrl/Cmd to select multiple</small>
          </div>

          {/* Visibility */}
          <div className="form-group">
            <label className="form-label">Visibility</label>
            <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="visibility"
                  value="PRIVATE"
                  checked={formData.visibility === 'PRIVATE'}
                  onChange={handleChange}
                />
                Private
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="visibility"
                  value="TEAM"
                  checked={formData.visibility === 'TEAM'}
                  onChange={handleChange}
                />
                Team
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="visibility"
                  value="PUBLIC"
                  checked={formData.visibility === 'PUBLIC'}
                  onChange={handleChange}
                />
                Public
              </label>
            </div>
          </div>

          {/* Teams (if Team visibility) */}
          {formData.visibility === 'TEAM' && (
            <div className="form-group">
              <label className="form-label" htmlFor="teams">Select Teams <span style={{color: 'red'}}>*</span></label>
              <select
                multiple
                id="teams"
                className="form-input"
                value={formData.team_ids}
                onChange={handleTeamChange}
                style={{ height: '100px' }}
                required
              >
                {teams.map(team => (
                  <option key={team.id} value={team.id}>{team.name}</option>
                ))}
              </select>
              <small className="text-secondary">Hold Ctrl/Cmd to select multiple</small>
            </div>
          )}

          {/* Save Location */}
          <div className="form-group">
            <label className="form-label">Save Location</label>
            <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '12px' }}>
              Choose where to save your prompt. This is independent of visibility settings.
            </p>

            {isLoadingFolders ? (
              <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>Loading folders...</p>
            ) : (
              <div style={{ display: 'flex', gap: '16px' }}>
                {/* Private Folders Section */}
                <div style={{
                  flex: 1,
                  padding: '16px',
                  backgroundColor: saveLocationType === 'PRIVATE' ? '#f0f9ff' : '#f9fafb',
                  borderRadius: '8px',
                  border: saveLocationType === 'PRIVATE' ? '2px solid var(--primary-color)' : '1px solid #e5e7eb'
                }}>
                  <div
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', cursor: 'pointer' }}
                    onClick={() => { setSaveLocationType('PRIVATE'); setFormData(prev => ({ ...prev, folder: '' })); }}
                  >
                    <Lock size={18} color="#6b7280" />
                    <span style={{ fontWeight: 600, color: '#374151' }}>Private Folders</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '10px',
                        backgroundColor: saveLocationType === 'PRIVATE' && !formData.folder ? '#dbeafe' : 'white',
                        border: saveLocationType === 'PRIVATE' && !formData.folder ? '1px solid var(--primary-color)' : '1px solid #e5e7eb',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '0.875rem'
                      }}
                    >
                      <input
                        type="radio"
                        name="folder"
                        value=""
                        checked={saveLocationType === 'PRIVATE' && !formData.folder}
                        onChange={() => { setSaveLocationType('PRIVATE'); setFormData(prev => ({ ...prev, folder: '' })); }}
                      />
                      <Folder size={16} color="#6b7280" />
                      <span>Private Root</span>
                    </label>

                    {privateFolders.map(folder => (
                      <label
                        key={folder.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '10px',
                          paddingLeft: '24px',
                          backgroundColor: saveLocationType === 'PRIVATE' && formData.folder === String(folder.id) ? '#dbeafe' : 'white',
                          border: saveLocationType === 'PRIVATE' && formData.folder === String(folder.id) ? '1px solid var(--primary-color)' : '1px solid #e5e7eb',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '0.875rem'
                        }}
                      >
                        <input
                          type="radio"
                          name="folder"
                          value={folder.id}
                          checked={saveLocationType === 'PRIVATE' && formData.folder === String(folder.id)}
                          onChange={() => { setSaveLocationType('PRIVATE'); setFormData(prev => ({ ...prev, folder: String(folder.id) })); }}
                        />
                        <Folder size={16} color="#6b7280" />
                        <span>{folder.name}</span>
                      </label>
                    ))}

                    {privateFolders.length === 0 && (
                      <p style={{ color: '#9ca3af', fontSize: '0.75rem', margin: '4px 0 0 0', fontStyle: 'italic' }}>
                        No subfolders
                      </p>
                    )}
                  </div>
                </div>

                {/* Public Folders Section */}
                <div style={{
                  flex: 1,
                  padding: '16px',
                  backgroundColor: saveLocationType === 'PUBLIC' ? '#f0f9ff' : '#f9fafb',
                  borderRadius: '8px',
                  border: saveLocationType === 'PUBLIC' ? '2px solid var(--primary-color)' : '1px solid #e5e7eb'
                }}>
                  <div
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', cursor: 'pointer' }}
                    onClick={() => { setSaveLocationType('PUBLIC'); setFormData(prev => ({ ...prev, folder: '' })); }}
                  >
                    <Globe size={18} color="#6b7280" />
                    <span style={{ fontWeight: 600, color: '#374151' }}>Public Folders</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '10px',
                        backgroundColor: saveLocationType === 'PUBLIC' && !formData.folder ? '#dbeafe' : 'white',
                        border: saveLocationType === 'PUBLIC' && !formData.folder ? '1px solid var(--primary-color)' : '1px solid #e5e7eb',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '0.875rem'
                      }}
                    >
                      <input
                        type="radio"
                        name="folder"
                        value=""
                        checked={saveLocationType === 'PUBLIC' && !formData.folder}
                        onChange={() => { setSaveLocationType('PUBLIC'); setFormData(prev => ({ ...prev, folder: '' })); }}
                      />
                      <Folder size={16} color="#6b7280" />
                      <span>Public Root</span>
                    </label>

                    {publicFolders.map(folder => (
                      <label
                        key={folder.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '10px',
                          paddingLeft: '24px',
                          backgroundColor: saveLocationType === 'PUBLIC' && formData.folder === String(folder.id) ? '#dbeafe' : 'white',
                          border: saveLocationType === 'PUBLIC' && formData.folder === String(folder.id) ? '1px solid var(--primary-color)' : '1px solid #e5e7eb',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '0.875rem'
                        }}
                      >
                        <input
                          type="radio"
                          name="folder"
                          value={folder.id}
                          checked={saveLocationType === 'PUBLIC' && formData.folder === String(folder.id)}
                          onChange={() => { setSaveLocationType('PUBLIC'); setFormData(prev => ({ ...prev, folder: String(folder.id) })); }}
                        />
                        <Folder size={16} color="#6b7280" />
                        <span>{folder.name}</span>
                      </label>
                    ))}

                    {publicFolders.length === 0 && (
                      <p style={{ color: '#9ca3af', fontSize: '0.75rem', margin: '4px 0 0 0', fontStyle: 'italic' }}>
                        No subfolders
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Submit */}
          <div style={{ marginTop: '32px' }}>
            <button type="submit" className="btn-primary" disabled={isLoading} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Save size={18} />
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>

        </form>

        {/* Change History Section */}
        <div style={{ maxWidth: '800px', marginTop: '32px' }}>
          <button
            type="button"
            onClick={() => setIsHistoryOpen(!isHistoryOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'none',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '12px 16px',
              cursor: 'pointer',
              width: '100%',
              fontSize: '1rem',
              fontWeight: 600,
              color: '#374151',
              backgroundColor: 'white'
            }}
          >
            {isHistoryOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
            Change History
          </button>

          {isHistoryOpen && (
            <div style={{
              background: 'white',
              border: '1px solid #e5e7eb',
              borderTop: 'none',
              borderRadius: '0 0 8px 8px',
              padding: '16px'
            }}>
              {isLoadingHistory ? (
                <p style={{ color: '#6b7280', textAlign: 'center', padding: '16px' }}>Loading history...</p>
              ) : history.length === 0 ? (
                <p style={{ color: '#6b7280', textAlign: 'center', padding: '16px' }}>No changes recorded yet.</p>
              ) : (
                <>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #e5e7eb', textAlign: 'left' }}>
                        <th style={{ padding: '10px 12px', color: '#6b7280', fontSize: '0.875rem', fontWeight: 600 }}>Date</th>
                        <th style={{ padding: '10px 12px', color: '#6b7280', fontSize: '0.875rem', fontWeight: 600 }}>User</th>
                        <th style={{ padding: '10px 12px', color: '#6b7280', fontSize: '0.875rem', fontWeight: 600 }}>Change</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.map(entry => (
                        <React.Fragment key={entry.id}>
                          <tr
                            style={{
                              borderBottom: expandedHistoryId === entry.id ? 'none' : '1px solid #f3f4f6',
                              cursor: 'pointer',
                              backgroundColor: expandedHistoryId === entry.id ? '#f9fafb' : 'transparent'
                            }}
                            onClick={() => setExpandedHistoryId(expandedHistoryId === entry.id ? null : entry.id)}
                          >
                            <td style={{ padding: '10px 12px', fontSize: '0.875rem', color: '#4b5563' }}>
                              {formatDate(entry.created_at)}
                            </td>
                            <td style={{ padding: '10px 12px', fontSize: '0.875rem', color: '#4b5563' }}>
                              {entry.changed_by_name || 'Unknown'}
                            </td>
                            <td style={{ padding: '10px 12px', fontSize: '0.875rem', color: '#4b5563', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              {expandedHistoryId === entry.id ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                              {entry.change_summary}
                            </td>
                          </tr>

                          {/* Expanded inline detail */}
                          {expandedHistoryId === entry.id && (
                            <tr>
                              <td colSpan="3" style={{ padding: '0 12px 12px 12px' }}>
                                <div style={{
                                  backgroundColor: '#f9fafb',
                                  border: '1px solid #e5e7eb',
                                  borderRadius: '6px',
                                  padding: '16px',
                                  fontSize: '0.875rem'
                                }}>
                                  <p style={{ fontWeight: 600, marginBottom: '12px', color: '#374151' }}>Snapshot at time of change:</p>
                                  <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '8px 16px' }}>
                                    {entry.snapshot.name !== undefined && (
                                      <>
                                        <span style={{ color: '#6b7280', fontWeight: 500 }}>Name:</span>
                                        <span style={{ color: '#111827' }}>{entry.snapshot.name}</span>
                                      </>
                                    )}
                                    {entry.snapshot.description !== undefined && (
                                      <>
                                        <span style={{ color: '#6b7280', fontWeight: 500 }}>Description:</span>
                                        <span style={{ color: '#111827' }}>{entry.snapshot.description || '(empty)'}</span>
                                      </>
                                    )}
                                    {entry.snapshot.model !== undefined && (
                                      <>
                                        <span style={{ color: '#6b7280', fontWeight: 500 }}>Model:</span>
                                        <span style={{ color: '#111827' }}>{entry.snapshot.model}</span>
                                      </>
                                    )}
                                    {entry.snapshot.visibility !== undefined && (
                                      <>
                                        <span style={{ color: '#6b7280', fontWeight: 500 }}>Visibility:</span>
                                        <span style={{ color: '#111827' }}>{entry.snapshot.visibility}</span>
                                      </>
                                    )}
                                    {entry.snapshot.prompt !== undefined && (
                                      <>
                                        <span style={{ color: '#6b7280', fontWeight: 500 }}>Prompt:</span>
                                        <span style={{ color: '#111827', whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                                          {entry.snapshot.prompt}
                                        </span>
                                      </>
                                    )}
                                  </div>
                                  <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                                    <button
                                      type="button"
                                      className="btn-secondary"
                                      disabled={isReverting}
                                      onClick={(e) => { e.stopPropagation(); handleRevert(entry.id); }}
                                      style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.875rem' }}
                                    >
                                      <RotateCcw size={14} />
                                      {isReverting ? 'Reverting...' : 'Revert to this version'}
                                    </button>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>

                  {/* History Pagination */}
                  {historyTotalPages > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginTop: '16px' }}>
                      <button
                        className="btn-secondary"
                        disabled={historyPage === 1}
                        onClick={() => setHistoryPage(historyPage - 1)}
                        style={{ fontSize: '0.875rem' }}
                      >
                        Previous
                      </button>
                      <span style={{ fontSize: '0.875rem', color: '#4b5563' }}>
                        Page {historyPage} of {historyTotalPages}
                      </span>
                      <button
                        className="btn-secondary"
                        disabled={historyPage === historyTotalPages}
                        onClick={() => setHistoryPage(historyPage + 1)}
                        style={{ fontSize: '0.875rem' }}
                      >
                        Next
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ViewPromptPage;
