const API_BASE_URL = '/api';

const getHeaders = () => {
  // In a real app, we might need auth tokens here if not using cookies
  // Since we are using cookies (credentials: 'include'), we just need Content-Type
  return {
    'Content-Type': 'application/json',
  };
};

export const api = {
  // Prompts
  getPrompts: async (params = {}) => {
    console.log('API: Fetching prompts', params);
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(`${API_BASE_URL}/prompts/?${queryString}`, {
      headers: getHeaders(),
      credentials: 'include',
    });
    if (!response.ok) throw new Error('Failed to fetch prompts');
    return response.json();
  },

  createPrompt: async (promptData) => {
    console.log('API: Creating prompt with data:', promptData);
    const response = await fetch(`${API_BASE_URL}/prompts/`, {
      method: 'POST',
      headers: getHeaders(),
      credentials: 'include',
      body: JSON.stringify(promptData),
    });
    if (!response.ok) {
        const errorData = await response.json();
        console.error('API: Create prompt failed', errorData);
        throw new Error(errorData.detail || JSON.stringify(errorData) || 'Failed to create prompt');
    }
    return response.json();
  },

  updatePrompt: async (id, promptData) => {
    console.log(`API: Updating prompt ${id}`, promptData);
    const response = await fetch(`${API_BASE_URL}/prompts/${id}/`, {
      method: 'PATCH',
      headers: getHeaders(),
      credentials: 'include',
      body: JSON.stringify(promptData),
    });
    if (!response.ok) throw new Error('Failed to update prompt');
    return response.json();
  },

  getPrompt: async (id) => {
    console.log(`API: Fetching prompt ${id}`);
    const response = await fetch(`${API_BASE_URL}/prompts/${id}/`, {
      headers: getHeaders(),
      credentials: 'include',
    });
    if (!response.ok) throw new Error('Failed to fetch prompt');
    return response.json();
  },

  deletePrompt: async (id) => {
    console.log(`API: Deleting prompt ${id}`);
    const response = await fetch(`${API_BASE_URL}/prompts/${id}/`, {
      method: 'DELETE',
      headers: getHeaders(),
      credentials: 'include',
    });
    if (!response.ok) throw new Error('Failed to delete prompt');
    return true;
  },

  getPromptHistory: async (id, params = {}) => {
    console.log(`API: Fetching history for prompt ${id}`, params);
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(`${API_BASE_URL}/prompts/${id}/history/?${queryString}`, {
      headers: getHeaders(),
      credentials: 'include',
    });
    if (!response.ok) throw new Error('Failed to fetch prompt history');
    return response.json();
  },

  revertPrompt: async (id, historyId) => {
    console.log(`API: Reverting prompt ${id} to history ${historyId}`);
    const response = await fetch(`${API_BASE_URL}/prompts/${id}/revert/`, {
      method: 'POST',
      headers: getHeaders(),
      credentials: 'include',
      body: JSON.stringify({ history_id: historyId }),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to revert prompt');
    }
    return response.json();
  },

  // Categories
  getCategories: async () => {
    console.log('API: Fetching categories');
    const response = await fetch(`${API_BASE_URL}/categories/`, {
      headers: getHeaders(),
      credentials: 'include',
    });
    if (!response.ok) throw new Error('Failed to fetch categories');
    return response.json();
  },

  createCategory: async (categoryData) => {
    console.log('API: Creating category:', categoryData);
    const response = await fetch(`${API_BASE_URL}/categories/`, {
      method: 'POST',
      headers: getHeaders(),
      credentials: 'include',
      body: JSON.stringify(categoryData),
    });
    if (!response.ok) throw new Error('Failed to create category');
    return response.json();
  },

  // Folders
  getFolders: async (params = {}) => {
    console.log('API: Fetching folders', params);
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(`${API_BASE_URL}/folders/?${queryString}`, {
      headers: getHeaders(),
      credentials: 'include',
    });
    if (!response.ok) throw new Error('Failed to fetch folders');
    return response.json();
  },

  createFolder: async (folderData) => {
    console.log('API: Creating folder', folderData);
    const response = await fetch(`${API_BASE_URL}/folders/`, {
      method: 'POST',
      headers: getHeaders(),
      credentials: 'include',
      body: JSON.stringify(folderData),
    });
    if (!response.ok) throw new Error('Failed to create folder');
    return response.json();
  },

  updateFolder: async (id, folderData) => {
    console.log(`API: Updating folder ${id}`, folderData);
    const response = await fetch(`${API_BASE_URL}/folders/${id}/`, {
      method: 'PATCH',
      headers: getHeaders(),
      credentials: 'include',
      body: JSON.stringify(folderData),
    });
    if (!response.ok) throw new Error('Failed to update folder');
    return response.json();
  },

  deleteFolder: async (id) => {
    console.log(`API: Deleting folder ${id}`);
    const response = await fetch(`${API_BASE_URL}/folders/${id}/`, {
      method: 'DELETE',
      headers: getHeaders(),
      credentials: 'include',
    });
    if (!response.ok) throw new Error('Failed to delete folder');
    return true;
  },

  // Organizations
  getOrganizations: async () => {
    console.log('API: Fetching organizations');
    const response = await fetch(`${API_BASE_URL}/organizations/`, {
      headers: getHeaders(),
      credentials: 'include',
    });
    if (!response.ok) throw new Error('Failed to fetch organizations');
    return response.json();
  },

  // Teams
  getTeams: async (params = {}) => {
    console.log('API: Fetching teams', params);
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(`${API_BASE_URL}/teams/?${queryString}`, {
      headers: getHeaders(),
      credentials: 'include',
    });
    if (!response.ok) throw new Error('Failed to fetch teams');
    return response.json();
  },

  createTeam: async (teamData) => {
    console.log('API: Creating team', teamData);
    const response = await fetch(`${API_BASE_URL}/teams/`, {
      method: 'POST',
      headers: getHeaders(),
      credentials: 'include',
      body: JSON.stringify(teamData),
    });
    if (!response.ok) throw new Error('Failed to create team');
    return response.json();
  },

  updateTeam: async (id, teamData) => {
    console.log(`API: Updating team ${id}`, teamData);
    const response = await fetch(`${API_BASE_URL}/teams/${id}/`, {
      method: 'PATCH',
      headers: getHeaders(),
      credentials: 'include',
      body: JSON.stringify(teamData),
    });
    if (!response.ok) throw new Error('Failed to update team');
    return response.json();
  },

  deleteTeam: async (id) => {
    console.log(`API: Deleting team ${id}`);
    const response = await fetch(`${API_BASE_URL}/teams/${id}/`, {
      method: 'DELETE',
      headers: getHeaders(),
      credentials: 'include',
    });
    if (!response.ok) throw new Error('Failed to delete team');
    return true;
  },

  getTeamMembers: async (teamId) => {
    console.log(`API: Fetching members for team ${teamId}`);
    const response = await fetch(`${API_BASE_URL}/teams/${teamId}/members/`, {
      headers: getHeaders(),
      credentials: 'include',
    });
    if (!response.ok) throw new Error('Failed to fetch team members');
    return response.json();
  },

  addTeamMember: async (teamId, userId, role = 'MEMBER') => {
    console.log(`API: Adding user ${userId} to team ${teamId}`);
    const response = await fetch(`${API_BASE_URL}/teams/${teamId}/add_member/`, {
      method: 'POST',
      headers: getHeaders(),
      credentials: 'include',
      body: JSON.stringify({ user_id: userId, role }),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add team member');
    }
    return response.json();
  },

  removeTeamMember: async (teamId, userId) => {
    console.log(`API: Removing user ${userId} from team ${teamId}`);
    const response = await fetch(`${API_BASE_URL}/teams/${teamId}/remove_member/`, {
      method: 'POST', // Using POST as per ViewSet action default, though DELETE is more RESTful. ViewSet action defaults to POST if not specified or unless detail=True which supports it. Let's check ViewSet.
      // ViewSet action defaults to POST.
      headers: getHeaders(),
      credentials: 'include',
      body: JSON.stringify({ user_id: userId }),
    });
    if (!response.ok) throw new Error('Failed to remove team member');
    return response.json();
  },

  // User
  getCurrentUser: async () => {
    console.log('API: Fetching current user');
    const response = await fetch(`${API_BASE_URL}/users/me/`, {
      headers: getHeaders(),
      credentials: 'include',
    });
    if (!response.ok) throw new Error('Failed to fetch user');
    return response.json();
  },

  getUsers: async (params = {}) => {
    console.log('API: Fetching users', params);
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(`${API_BASE_URL}/users/?${queryString}`, {
      headers: getHeaders(),
      credentials: 'include',
    });
    if (!response.ok) throw new Error('Failed to fetch users');
    return response.json();
  },

  createUser: async (userData) => {
    console.log('API: Creating user', userData);
    const response = await fetch(`${API_BASE_URL}/users/`, {
      method: 'POST',
      headers: getHeaders(),
      credentials: 'include',
      body: JSON.stringify(userData),
    });
    if (!response.ok) {
      const errorData = await response.json();
      console.error('API: Create user failed', errorData);
      throw new Error(errorData.detail || errorData.non_field_errors || JSON.stringify(errorData) || 'Failed to create user');
    }
    return response.json();
  },

  updateUser: async (id, userData) => {
    console.log(`API: Updating user ${id}`, userData);
    const response = await fetch(`${API_BASE_URL}/users/${id}/`, {
      method: 'PATCH',
      headers: getHeaders(),
      credentials: 'include',
      body: JSON.stringify(userData),
    });
    if (!response.ok) {
      const errorData = await response.json();
      console.error('API: Update user failed', errorData);
      throw new Error(errorData.detail || JSON.stringify(errorData) || 'Failed to update user');
    }
    return response.json();
  },

  deleteUser: async (id, organizationId) => {
    console.log(`API: Deleting (soft) user ${id}`);
    const response = await fetch(`${API_BASE_URL}/users/${id}/?organization_id=${organizationId}`, {
      method: 'DELETE',
      headers: getHeaders(),
      credentials: 'include',
    });
    if (!response.ok) {
      const errorData = await response.json();
      console.error('API: Delete user failed', errorData);
      throw new Error(errorData.error || 'Failed to delete user');
    }
    return true;
  },

  assignUserTeam: async (userId, teamId) => {
    console.log(`API: Assigning user ${userId} to team ${teamId}`);
    const response = await fetch(`${API_BASE_URL}/users/${userId}/assign_team/`, {
      method: 'POST',
      headers: getHeaders(),
      credentials: 'include',
      body: JSON.stringify({ team_id: teamId }),
    });
    if (!response.ok) {
      const errorData = await response.json();
      console.error('API: Assign team failed', errorData);
      throw new Error(errorData.error || 'Failed to assign team');
    }
    return response.json();
  },

  removeUserTeam: async (userId, teamId) => {
    console.log(`API: Removing user ${userId} from team ${teamId}`);
    const response = await fetch(`${API_BASE_URL}/users/${userId}/remove_team/`, {
      method: 'POST',
      headers: getHeaders(),
      credentials: 'include',
      body: JSON.stringify({ team_id: teamId }),
    });
    if (!response.ok) {
      const errorData = await response.json();
      console.error('API: Remove team failed', errorData);
      throw new Error(errorData.error || 'Failed to remove team');
    }
    return response.json();
  },
};
