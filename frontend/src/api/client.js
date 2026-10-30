/**
 * PlanWars AI Frontend API Client.
 * Connects to Express backend via VITE_API_URL or relative /api proxy.
 */

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

/**
 * Standard fetch wrapper with JSON serialization and robust error normalization.
 * @param {string} endpoint
 * @param {RequestInit} [options]
 * @returns {Promise<any>}
 */
async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  };

  try {
    const res = await fetch(url, config);
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const errorMsg = data.message || data.error || `HTTP error ${res.status}`;
      const err = new Error(errorMsg);
      err.status = res.status;
      err.details = data.details;
      throw err;
    }

    return data;
  } catch (err) {
    if (err.name === 'TypeError' && err.message.toLowerCase().includes('fetch')) {
      throw new Error(`Unable to connect to backend server (${err.message}). Please ensure the backend is running on port 5000.`);
    }
    throw err;
  }
}

export const api = {
  // Health
  getHealth: () => request('/health'),

  // Intake
  intakeChat: (payload) => request('/intake/chat', { method: 'POST', body: JSON.stringify(payload) }),
  intakeInitialize: (payload) => request('/intake/initialize', { method: 'POST', body: JSON.stringify(payload) }),

  // Events
  getEvents: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/events${query ? `?${query}` : ''}`);
  },
  createEvent: (data) => request('/events', { method: 'POST', body: JSON.stringify(data) }),
  getEvent: (id) => request(`/events/${id}`),
  updateEvent: (id, data) => request(`/events/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteEvent: (id) => request(`/events/${id}`, { method: 'DELETE' }),

  // Budget
  getBudget: (eventId) => request(`/events/${eventId}/budget`),
  addBudgetItem: (eventId, data) => request(`/events/${eventId}/budget`, { method: 'POST', body: JSON.stringify(data) }),
  updateBudgetItem: (eventId, itemId, data) => request(`/events/${eventId}/budget/${itemId}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteBudgetItem: (eventId, itemId) => request(`/events/${eventId}/budget/${itemId}`, { method: 'DELETE' }),
  generateBudget: (eventId, overwrite = false) => request(`/events/${eventId}/budget/generate`, { method: 'POST', body: JSON.stringify({ overwrite }) }),

  // Timeline
  getTimeline: (eventId) => request(`/events/${eventId}/timeline`),
  addTimelineTask: (eventId, data) => request(`/events/${eventId}/timeline`, { method: 'POST', body: JSON.stringify(data) }),
  updateTimelineTask: (eventId, taskId, data) => request(`/events/${eventId}/timeline/${taskId}`, { method: 'PATCH', body: JSON.stringify(data) }),
  generateTimeline: (eventId, overwrite = false) => request(`/events/${eventId}/timeline/generate`, { method: 'POST', body: JSON.stringify({ overwrite }) }),

  // Vendors
  getVendors: (eventId) => request(`/events/${eventId}/vendors`),
  createVendor: (eventId, data) => request(`/events/${eventId}/vendors`, { method: 'POST', body: JSON.stringify(data) }),
  generateVendorCategories: (eventId) => request(`/events/${eventId}/vendors/generate`, { method: 'POST' }),
  addVendorChecklistItem: (eventId, vendorId, data) => request(`/events/${eventId}/vendors/${vendorId}/checklist`, { method: 'POST', body: JSON.stringify(data) }),
  toggleVendorChecklistItem: (eventId, itemId, isCompleted) => request(`/events/${eventId}/vendors/checklist/${itemId}`, { method: 'PATCH', body: JSON.stringify({ isCompleted }) }),
  compareVendorQuote: (eventId, vendorId, data) => request(`/events/${eventId}/vendors/${vendorId}/quotes/compare`, { method: 'POST', body: JSON.stringify(data) }),

  // Ideas
  getIdeas: (eventId, params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/events/${eventId}/ideas${query ? `?${query}` : ''}`);
  },
  generateIdeas: (eventId, focusArea) => request(`/events/${eventId}/ideas/generate`, { method: 'POST', body: JSON.stringify({ focusArea }) }),
  refineIdea: (eventId, ideaId, instruction) => request(`/events/${eventId}/ideas/refine`, { method: 'POST', body: JSON.stringify({ ideaId, instruction }) }),
  toggleSaveIdea: (eventId, ideaId, isSaved) => request(`/events/${eventId}/ideas/${ideaId}`, { method: 'PATCH', body: JSON.stringify({ isSaved }) }),

  // Re-plan
  evaluateReplan: (eventId, data) => request(`/events/${eventId}/replan/evaluate`, { method: 'POST', body: JSON.stringify(data) }),
  applyReplan: (eventId, data) => request(`/events/${eventId}/replan/apply`, { method: 'POST', body: JSON.stringify(data) })
};

