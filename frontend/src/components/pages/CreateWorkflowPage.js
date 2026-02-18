import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, AlertCircle, Plus, ChevronUp, ChevronDown, X } from 'lucide-react';
import Sidebar from '../shared/Sidebar';
import { api } from '../../services/api';

const CreateWorkflowPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    visibility: 'PRIVATE',
    team_ids: [],
  });
  const [steps, setSteps] = useState([]);
  const [allPrompts, setAllPrompts] = useState([]);
  const [promptSearch, setPromptSearch] = useState('');
  const [teams, setTeams] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingPrompts, setIsLoadingPrompts] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [teamsData] = await Promise.all([api.getTeams()]);
        setTeams(teamsData.results || teamsData);
      } catch (err) {
        console.error('Error fetching teams:', err);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const fetchPrompts = async () => {
      setIsLoadingPrompts(true);
      try {
        const params = { page_size: 100 };
        if (promptSearch) params.search = promptSearch;
        const data = await api.getPrompts(params);
        setAllPrompts(data.results || data);
      } catch (err) {
        console.error('Error fetching prompts:', err);
      } finally {
        setIsLoadingPrompts(false);
      }
    };
    fetchPrompts();
  }, [promptSearch]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleTeamChange = (e) => {
    const selected = Array.from(e.target.selectedOptions, o => o.value);
    setFormData(prev => ({ ...prev, team_ids: selected }));
  };

  const addStep = (prompt) => {
    if (steps.find(s => s.prompt === prompt.id)) return;
    setSteps(prev => [
      ...prev,
      { prompt: prompt.id, prompt_name: prompt.name, order: prev.length, name: '' }
    ]);
  };

  const removeStep = (index) => {
    setSteps(prev => {
      const updated = prev.filter((_, i) => i !== index);
      return updated.map((s, i) => ({ ...s, order: i }));
    });
  };

  const moveStep = (index, direction) => {
    setSteps(prev => {
      const updated = [...prev];
      const swapIndex = index + direction;
      if (swapIndex < 0 || swapIndex >= updated.length) return prev;
      [updated[index], updated[swapIndex]] = [updated[swapIndex], updated[index]];
      return updated.map((s, i) => ({ ...s, order: i }));
    });
  };

  const updateStepName = (index, value) => {
    setSteps(prev => prev.map((s, i) => i === index ? { ...s, name: value } : s));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) { setError('Workflow name is required'); return; }
    if (steps.length === 0) { setError('Add at least one step'); return; }
    if (formData.visibility === 'TEAM' && formData.team_ids.length === 0) {
      setError('Select at least one team for Team visibility');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      const payload = {
        ...formData,
        steps: steps.map(s => ({ prompt: s.prompt, order: s.order, name: s.name })),
      };
      if (formData.visibility !== 'TEAM') payload.team_ids = [];
      const created = await api.createWorkflow(payload);
      navigate(`/dashboard/workflows/${created.id}`);
    } catch (err) {
      console.error('Create workflow error:', err);
      setError(err.message || 'Failed to create workflow');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredPrompts = allPrompts.filter(p =>
    !steps.find(s => s.prompt === p.id)
  );

  return (
    <div className="dashboard-container">
      <Sidebar />
      <main className="main-content">
        <h1 className="page-title">New Workflow</h1>

        {error && (
          <div className="error-message" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={20} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ maxWidth: '800px', background: 'white', padding: '24px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>

          {/* Name */}
          <div className="form-group">
            <label className="form-label" htmlFor="name">Workflow Name <span style={{ color: 'red' }}>*</span></label>
            <input
              type="text"
              id="name"
              name="name"
              className="form-input"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., Customer Onboarding Flow"
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
              placeholder="What does this workflow accomplish?"
              rows={3}
              style={{ resize: 'vertical' }}
            />
          </div>

          {/* Visibility */}
          <div className="form-group">
            <label className="form-label">Visibility</label>
            <div style={{ display: 'flex', gap: '16px' }}>
              {['PRIVATE', 'TEAM', 'PUBLIC'].map(v => (
                <label key={v} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="visibility"
                    value={v}
                    checked={formData.visibility === v}
                    onChange={handleChange}
                  />
                  {v.charAt(0) + v.slice(1).toLowerCase()}
                </label>
              ))}
            </div>
          </div>

          {/* Teams */}
          {formData.visibility === 'TEAM' && (
            <div className="form-group">
              <label className="form-label">Select Teams <span style={{ color: 'red' }}>*</span></label>
              <select
                multiple
                className="form-input"
                value={formData.team_ids}
                onChange={handleTeamChange}
                style={{ height: '100px' }}
              >
                {teams.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
              <small className="text-secondary">Hold Ctrl/Cmd to select multiple</small>
            </div>
          )}

          {/* Steps Builder */}
          <div className="form-group">
            <label className="form-label">Steps <span style={{ color: 'red' }}>*</span></label>
            <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '12px' }}>
              Search and add prompts, then use the arrows to set their order.
            </p>

            <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
              {/* Prompt picker */}
              <div style={{ flex: 1, border: '1px solid #e5e7eb', borderRadius: '8px', padding: '12px' }}>
                <p style={{ fontWeight: 600, fontSize: '0.875rem', color: '#374151', marginBottom: '8px' }}>Available Prompts</p>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Search prompts..."
                  value={promptSearch}
                  onChange={(e) => setPromptSearch(e.target.value)}
                  style={{ marginBottom: '8px' }}
                />
                <div style={{ maxHeight: '220px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {isLoadingPrompts ? (
                    <p style={{ color: '#6b7280', fontSize: '0.875rem', padding: '8px' }}>Loading...</p>
                  ) : filteredPrompts.length === 0 ? (
                    <p style={{ color: '#6b7280', fontSize: '0.875rem', padding: '8px' }}>No prompts available</p>
                  ) : (
                    filteredPrompts.map(p => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => addStep(p)}
                        style={{
                          textAlign: 'left',
                          padding: '8px 10px',
                          border: '1px solid #e5e7eb',
                          borderRadius: '6px',
                          background: 'white',
                          cursor: 'pointer',
                          fontSize: '0.875rem',
                          color: '#111827',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <span>{p.name}</span>
                        <Plus size={14} color="#6b7280" />
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* Step list */}
              <div style={{ flex: 1, border: '1px solid #e5e7eb', borderRadius: '8px', padding: '12px', minHeight: '120px' }}>
                <p style={{ fontWeight: 600, fontSize: '0.875rem', color: '#374151', marginBottom: '8px' }}>
                  Workflow Steps ({steps.length})
                </p>
                {steps.length === 0 ? (
                  <p style={{ color: '#9ca3af', fontSize: '0.875rem', fontStyle: 'italic' }}>No steps added yet</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {steps.map((step, index) => (
                      <div
                        key={step.prompt}
                        style={{
                          border: '1px solid #e5e7eb',
                          borderRadius: '6px',
                          padding: '8px 10px',
                          background: '#f9fafb',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6b7280', minWidth: '20px' }}>
                            {index + 1}.
                          </span>
                          <span style={{ fontSize: '0.875rem', color: '#111827', flex: 1, fontWeight: 500 }}>
                            {step.prompt_name}
                          </span>
                          <button type="button" onClick={() => moveStep(index, -1)} disabled={index === 0} style={{ background: 'none', border: 'none', cursor: index === 0 ? 'default' : 'pointer', padding: '2px', color: index === 0 ? '#d1d5db' : '#6b7280' }}>
                            <ChevronUp size={16} />
                          </button>
                          <button type="button" onClick={() => moveStep(index, 1)} disabled={index === steps.length - 1} style={{ background: 'none', border: 'none', cursor: index === steps.length - 1 ? 'default' : 'pointer', padding: '2px', color: index === steps.length - 1 ? '#d1d5db' : '#6b7280' }}>
                            <ChevronDown size={16} />
                          </button>
                          <button type="button" onClick={() => removeStep(index)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: '#dc2626' }}>
                            <X size={16} />
                          </button>
                        </div>
                        <input
                          type="text"
                          placeholder="Step label (optional)"
                          value={step.name}
                          onChange={(e) => updateStepName(index, e.target.value)}
                          style={{
                            width: '100%',
                            padding: '4px 8px',
                            border: '1px solid #e5e7eb',
                            borderRadius: '4px',
                            fontSize: '0.8rem',
                            color: '#374151',
                            boxSizing: 'border-box',
                          }}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Submit */}
          <div style={{ marginTop: '32px' }}>
            <button
              type="submit"
              className="btn-primary"
              disabled={isLoading}
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <Save size={18} />
              {isLoading ? 'Creating...' : 'Create Workflow'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default CreateWorkflowPage;
