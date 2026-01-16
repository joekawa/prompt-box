import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, AlertCircle, CheckCircle, Plus } from 'lucide-react';
import Sidebar from '../shared/Sidebar';
import { api } from '../../services/api';

const CreatePromptPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    prompt: '',
    model: 'gpt-3.5-turbo',
    visibility: 'PRIVATE',
    category_ids: [],
    team_ids: []
  });

  const [categories, setCategories] = useState([]);
  const [teams, setTeams] = useState([]);
  const [folders, setFolders] = useState([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Organization ID - in a real app this should come from context/auth
  // For now we'll fetch the user and use their first organization or a default
  // This is a simplification for the demo
  const [organizationId, setOrganizationId] = useState(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      console.log('Page: Fetching initial data...');
      const [catsData, teamsData, orgsData] = await Promise.all([
        api.getCategories(),
        api.getTeams(),
        api.getOrganizations()
      ]);

      console.log('Page: Data fetched:', { catsData, teamsData, orgsData });

      setCategories(catsData);
      setTeams(teamsData);

      // Set the first organization as default if available
      if (orgsData && orgsData.length > 0) {
        setOrganizationId(orgsData[0].id);
        console.log('Page: Set Organization ID:', orgsData[0].id);
      } else {
        console.warn('Page: No organizations found for user');
        setError('No organization found. Please contact an admin.');
      }

    } catch (err) {
      console.error('Page: Error fetching data:', err);
      setError('Failed to load initial data. Please ensure the backend is running.');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    console.log(`Page: Form change - ${name}: ${value}`);
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError('');
  };

  const handleCategoryChange = (e) => {
    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
    console.log('Page: Category selection changed:', selectedOptions);
    setFormData(prev => ({
      ...prev,
      category_ids: selectedOptions
    }));
  };

  const handleTeamChange = (e) => {
    const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
    console.log('Page: Team selection changed:', selectedOptions);
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
      console.log('Page: Creating new category:', newCategoryName);
      const newCat = await api.createCategory({
        name: newCategoryName,
        organization: organizationId,
        description: 'Created via frontend'
      });
      setCategories(prev => [...prev, newCat]);
      // Auto-select the new category
      setFormData(prev => ({
        ...prev,
        category_ids: [...prev.category_ids, newCat.id]
      }));
      setNewCategoryName('');
      setIsCreatingCategory(false);
      console.log('Page: Category created successfully');
    } catch (err) {
      console.error('Page: Failed to create category:', err);
      setError('Failed to create category');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Page: Submitting form...', formData);
    setIsLoading(true);
    setError('');
    setSuccess('');

    // Validation
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
    if (!organizationId) {
      setError('Organization context is missing. Cannot save.');
      setIsLoading(false);
      return;
    }
    if (formData.visibility === 'TEAM' && formData.team_ids.length === 0) {
      setError('Please select at least one team for Team visibility');
      setIsLoading(false);
      return;
    }

    try {
      const payload = {
        ...formData,
        organization: organizationId
      };

      // If visibility is PRIVATE, we can clear team_ids to be safe, though the backend might handle it
      if (payload.visibility === 'PRIVATE') {
        payload.team_ids = [];
      }

      const result = await api.createPrompt(payload);
      console.log('Page: Prompt created successfully:', result);
      setSuccess('Prompt created successfully!');

      // Navigate to success page or clear form
      // Using a simple timeout to show success before redirecting or clearing
      setTimeout(() => {
        // For now, stay on page or go to dashboard
         navigate('/dashboard');
      }, 1500);

    } catch (err) {
      console.error('Page: Submission error:', err);
      setError(err.message || 'Failed to create prompt');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="dashboard-container">
      <Sidebar />
      <main className="main-content">
        <h1 className="page-title">Create New Prompt</h1>

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

          {/* Step 1: Prompt Name */}
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

          {/* Step 2: Prompt Content */}
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

          {/* Step 3: Select AI Model */}
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

          {/* Step 4: Categorize */}
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

          {/* Step 5: Sharing Settings */}
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

          {/* Step 6: Select Team (if Team visibility) */}
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

          {/* Step 7: Select Folder */}
          <div className="form-group">
            <label className="form-label" htmlFor="folder">
              Select Folder ({formData.visibility === 'PRIVATE' ? 'Private' : 'Team'})
            </label>
            <select
              id="folder"
              name="folder"
              className="form-input"
              value={formData.folder}
              onChange={handleChange}
            >
              <option value="">-- No Folder (Root) --</option>
              {folders.map(folder => (
                <option key={folder.id} value={folder.id}>{folder.name}</option>
              ))}
            </select>
          </div>

          {/* Submit */}
          <div style={{ marginTop: '32px' }}>
            <button type="submit" className="btn-primary" disabled={isLoading} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Save size={18} />
              {isLoading ? 'Saving...' : 'Save Prompt'}
            </button>
          </div>

        </form>
      </main>
    </div>
  );
};

export default CreatePromptPage;
