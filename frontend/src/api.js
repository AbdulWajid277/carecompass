const API_BASE = import.meta.env.VITE_API_URL || '/api';

async function request(path, { method = 'GET', body, token } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    const error = new Error(
      'Cannot reach the CareCompass server. Make sure the API is running on port 4000.'
    );
    error.status = 0;
    throw error;
  }

  let data = null;
  const text = await response.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { error: text };
    }
  }

  if (!response.ok) {
    const error = new Error(data?.error || 'Request failed');
    error.status = response.status;
    error.details = data?.details;
    throw error;
  }

  return data;
}

export const api = {
  health: () => request('/health'),
  register: (body) => request('/auth/register', { method: 'POST', body }),
  login: (body) => request('/auth/login', { method: 'POST', body }),
  me: (token) => request('/auth/me', { token }),
  categories: () => request('/resources/categories'),
  searchResources: (params = {}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') qs.set(key, value);
    });
    const query = qs.toString();
    return request(`/resources${query ? `?${query}` : ''}`);
  },
  getResource: (id) => request(`/resources/${id}`),
  favorite: (id, token) =>
    request(`/resources/${id}/favorite`, { method: 'POST', token }),
  unfavorite: (id, token) =>
    request(`/resources/${id}/favorite`, { method: 'DELETE', token }),
  favorites: (token) => request('/resources/favorites', { token }),
  askAi: (body, token) =>
    request('/ai/ask', { method: 'POST', body, token }),
  adminStats: (token) => request('/admin/stats', { token }),
  adminResources: (token) => request('/admin/resources', { token }),
  createResource: (body, token) =>
    request('/admin/resources', { method: 'POST', body, token }),
  updateResource: (id, body, token) =>
    request(`/admin/resources/${id}`, { method: 'PUT', body, token }),
};
