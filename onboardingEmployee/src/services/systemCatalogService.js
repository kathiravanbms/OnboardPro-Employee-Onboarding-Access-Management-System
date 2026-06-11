import { apiClient, unwrapApiResponse } from "./apiClient";

export async function listSystems(params = {}) {
  const response = await apiClient.get("/system-catalog", { params });
  return unwrapApiResponse(response);
}

export async function createSystem(system) {
  const response = await apiClient.post("/system-catalog", system);
  return unwrapApiResponse(response);
}

export async function listActiveUsers(systemId) {
  const response = await apiClient.get(`/system-catalog/${systemId}/active-users`);
  return unwrapApiResponse(response);
}

export async function listActiveUsersSummary() {
  const response = await apiClient.get("/system-catalog/active-users-summary");
  return unwrapApiResponse(response);
}

export async function updateSystem(id, system) {
  const response = await apiClient.put(`/system-catalog/${id}`, system);
  return unwrapApiResponse(response);
}

export async function deactivateSystem(id) {
  const response = await apiClient.patch(`/system-catalog/${id}/withdraw`);
  return unwrapApiResponse(response);
}

export async function approveSystem(id) {
  const response = await apiClient.patch(`/system-catalog/${id}/approve`);
  return unwrapApiResponse(response);
}

export async function rejectSystem(id, reason) {
  const response = await apiClient.patch(`/system-catalog/${id}/reject`, { reason });
  return unwrapApiResponse(response);
}

export async function withdrawSystem(id) {
  const response = await apiClient.patch(`/system-catalog/${id}/withdraw`);
  return unwrapApiResponse(response);
}

export async function searchSystems(query) {
  const response = await apiClient.get("/system-catalog", { params: { q: query } });
  return unwrapApiResponse(response);
}

export const systemCatalogService = {
  listSystems,
  listActiveUsers,
  listActiveUsersSummary,
  createSystem,
  updateSystem,
  deactivateSystem,
  approveSystem,
  rejectSystem,
  withdrawSystem,
  searchSystems,
};
