import { api } from "../../lib/apiClient.js";

export const fetchTrackings = () => api.get("/trackings");
export const fetchTrackingCode = () => api.get("/trackings/code");
export const fetchTracking = (id) => api.get(`/trackings/${encodeURIComponent(id)}`);
export const fetchAvailableSessions = () => api.get("/trackings/available-sessions");
export const createTracking = (tracking_code, session_id) =>
  api.post("/trackings", { tracking_code, session_id });
export const fetchTrackingSessions = (id) => api.get(`/trackings/${encodeURIComponent(id)}/sessions`);
export const fetchTrackingEvolution = (id) => api.get(`/trackings/${id}/evolution`);
export const addTrackingSessions = (id, session_ids) =>
  api.post(`/trackings/${id}/sessions`, { session_ids });
export const removeTrackingSession = (id, sessionId) =>
  api.delete(`/trackings/${id}/sessions/${encodeURIComponent(sessionId)}`);
export const deleteTracking = (id) => api.delete(`/trackings/${id}`);
