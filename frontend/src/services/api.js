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
  getTeams: async () => {
    console.log('API: Fetching teams');
    const response = await fetch(`${API_BASE_URL}/teams/`, {
      headers: getHeaders(),
      credentials: 'include',
    });
    if (!response.ok) throw new Error('Failed to fetch teams');
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
  }
};
