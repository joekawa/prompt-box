import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Save, AlertCircle, CheckCircle, Plus, ChevronUp, ChevronDown, X, ChevronRight, RotateCcw } from 'lucide-react';
import Sidebar from '../shared/Sidebar';
import { api } from '../../services/api';

const ViewWorkflowPage = () => {
  const { id } = useParams();
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
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingWorkflow, setIsLoadingWorkflow] = useState(true);
  const [isLoadingPrompts, setIsLoadingPrompts] = useState(false);

  // History state
  const [history, setHistory] = useState([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotalPages, setHistoryTotalPages] = useState(1);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [expandedHistoryId, setExpandedHistoryId] = useState(null);

  // Fetch teams and prompts
  useEffect(() => {
    const fetchData = async () => {
      try {
        const teamsData = await api.getTeams();
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

  // Fetch workflow
  useEffect(() => {
    const fetchWorkflow = async () => {
      setIsLoadingWorkflow(true);
      try {
        const data = await api.getWorkflow(id);
        const teamIds = data.shared_teams ? data.shared_teams.map(t => t.team) : [];
        setFormData({
          name: data.name || '',
          description: data.description || '',
          visibility: data.visibility || 'PRIVATE',
          team_ids: teamIds,
        });
        const loadedSteps = (data.steps || []).map(s => ({
          prompt: s.prompt,
          prompt_name: s.prompt_name || '',
          order: s.order,
          name: s.name || '',
        }));
        setSteps(loadedSteps.sort((a, b) => a.order - b.order));
      } catch (err) {
        console.error('Error fetching workflow:', err);
        setError('Failed to load workflow.');
      } finally {
        setIsLoadingWorkflow(false);
      }
    };
    if (id) fetchWorkflow();
  }, [id]);

  // Fetch history
  const fetchHistory = useCallback(async (page) => {
    setIsLoadingHistory(true);
    try {
      const data = await api.getWorkflowHistory(id, { page, page_size: 10 });
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
    if (isHistoryOpen) fetchHistory(historyPage);
  }, [isHistoryOpen, historyPage, fetchHistory]);

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
    setSuccess('');
    try {
      const payload = {
        ...formData,
        steps: steps.map(s => ({ prompt: s.prompt, order: s.order, name: s.name })),
      };
      if (formData.visibility !== 'TEAM') payload.team_ids = [];
      await api.updateWorkflow(id, payload);
      setSuccess('Workflow updated successfully!');
      if (isHistoryOpen) fetchHistory(historyPage);
    } catch (err) {
      console.error('Update workflow error:', err);
      setError(err.message || 'Failed to update workflow');
    } finally {
      setIsLoading(false);
    }
  };

  const applySnapshot = (snapshot) => {
    setFormData({
      name: snapshot.name || '',
      description: snapshot.description || '',
      visibility: snapshot.visibility || 'PRIVATE',
      team_ids: snapshot.team_ids || [],
    });
    const restoredSteps = (snapshot.steps || []).map((s, i) => {
      const matchedPrompt = allPrompts.find(p => p.id === s.prompt);
      return {
        prompt: s.prompt,
        prompt_name: matchedPrompt ? matchedPrompt.name : s.prompt,
        order: s.order !== undefined ? s.order : i,
        name: s.name || '',
      };
    });
    setSteps(restoredSteps.sort((a, b) => a.order - b.order));
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const filteredPrompts = allPrompts.filter(p => !steps.find(s => s.prompt === p.id));

  if (isLoadingWorkflow) {
    return (
      <div className="dashboard-container">
        <Sidebar />
        <main className="main-content">
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
            <p>Loading workflow...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <Sidebar />
      <main className="main-content">
        <h1 className="page-title">Edit Workflow</h1>

        {error && (
          <div className="error-message" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={20} />
            {error}
          </div>
        )}

        {success && (
          <div style={{
            backgroundColor: '#ecfdf5', color: '#059669', padding: '12px',
            borderRadius: '6px', marginBottom: '20px',
            display: 'flex', alignItems: 'center', gap: '8px',
          }}>
            <CheckCircle size={20} />
            {success}
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
                          textAlign: 'left', padding: '8px 10px',
                          border: '1px solid #e5e7eb', borderRadius: '6px',
                          background: 'white', cursor: 'pointer',
                          fontSize: '0.875rem', color: '#111827',
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
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
                        style={{ border: '1px solid #e5e7eb', borderRadius: '6px', padding: '8px 10px', background: '#f9fafb' }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6b7280', minWidth: '20px' }}>
                            {index + 1}.
                          </span>
                          <span style={{ fontSize: '0.875rem', color: '#111827', flex: 1, fontWeight: 500 }}>
                            {step.prompt_name || step.prompt}
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
                            width: '100%', padding: '4px 8px',
                            border: '1px solid #e5e7eb', borderRadius: '4px',
                            fontSize: '0.8rem', color: '#374151', boxSizing: 'border-box',
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
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>

        {/* Change History */}
        <div style={{ maxWidth: '800px', marginTop: '32px' }}>
          <button
            type="button"
            onClick={() => setIsHistoryOpen(!isHistoryOpen)}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              background: 'none', border: '1px solid #e5e7eb', borderRadius: '8px',
              padding: '12px 16px', cursor: 'pointer', width: '100%',
              fontSize: '1rem', fontWeight: 600, color: '#374151', backgroundColor: 'white',
            }}
          >
            {isHistoryOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
            Change History
          </button>

          {isHistoryOpen && (
            <div style={{
              background: 'white', border: '1px solid #e5e7eb',
              borderTop: 'none', borderRadius: '0 0 8px 8px', padding: '16px',
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
                              backgroundColor: expandedHistoryId === entry.id ? '#f9fafb' : 'transparent',
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

                          {expandedHistoryId === entry.id && (
                            <tr>
                              <td colSpan="3" style={{ padding: '0 12px 12px 12px' }}>
                                <div style={{
                                  backgroundColor: '#f9fafb', border: '1px solid #e5e7eb',
                                  borderRadius: '6px', padding: '16px', fontSize: '0.875rem',
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
                                    {entry.snapshot.visibility !== undefined && (
                                      <>
                                        <span style={{ color: '#6b7280', fontWeight: 500 }}>Visibility:</span>
                                        <span style={{ color: '#111827' }}>{entry.snapshot.visibility}</span>
                                      </>
                                    )}
                                    {entry.snapshot.steps && entry.snapshot.steps.length > 0 && (
                                      <>
                                        <span style={{ color: '#6b7280', fontWeight: 500, alignSelf: 'flex-start' }}>Steps:</span>
                                        <div>
                                          {entry.snapshot.steps.map((s, i) => {
                                            const matchedPrompt = allPrompts.find(p => p.id === s.prompt);
                                            return (
                                              <div key={i} style={{ fontSize: '0.8rem', color: '#374151', marginBottom: '2px' }}>
                                                {i + 1}. {matchedPrompt ? matchedPrompt.name : s.prompt}
                                                {s.name ? ` — ${s.name}` : ''}
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </>
                                    )}
                                  </div>
                                  <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                                    <button
                                      type="button"
                                      className="btn-secondary"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (window.confirm('Revert workflow to this version?')) {
                                          applySnapshot(entry.snapshot);
                                          setExpandedHistoryId(null);
                                          setSuccess('Snapshot loaded. Click Save Changes to apply the revert.');
                                        }
                                      }}
                                      style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.875rem' }}
                                    >
                                      <RotateCcw size={14} />
                                      Revert to this version
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

                  {historyTotalPages > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginTop: '16px' }}>
                      <button className="btn-secondary" disabled={historyPage === 1} onClick={() => setHistoryPage(historyPage - 1)} style={{ fontSize: '0.875rem' }}>Previous</button>
                      <span style={{ fontSize: '0.875rem', color: '#4b5563' }}>Page {historyPage} of {historyTotalPages}</span>
                      <button className="btn-secondary" disabled={historyPage === historyTotalPages} onClick={() => setHistoryPage(historyPage + 1)} style={{ fontSize: '0.875rem' }}>Next</button>
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

export default ViewWorkflowPage;
