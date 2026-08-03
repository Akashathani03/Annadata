import { apiRequest } from './apiClient';

// Step 10: internals now call the real Government Schemes domain
// service (backend). Function names/signatures unchanged - Schemes.jsx
// needs no changes to how it calls these.
export async function getSchemes({ type = 'all', stateFilter = 'Karnataka', query = '' } = {}) {
  const params = new URLSearchParams({ type, stateFilter });
  if (query) params.set('q', query);
  const { schemes } = await apiRequest(`/schemes?${params.toString()}`);
  return schemes;
}

export async function getSchemeById(id) {
  const { scheme } = await apiRequest(`/schemes/${id}`);
  return scheme;
}
