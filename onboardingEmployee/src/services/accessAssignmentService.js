import { apiClient, unwrapApiResponse } from "./apiClient";

export async function listAssignments(params = {}) {
  const response = await apiClient.get("/access-assignments", { params });
  return unwrapApiResponse(response);
}

export async function getAssignmentDetails(id) {
  const response = await apiClient.get(`/access-assignments/${id}`);
  return unwrapApiResponse(response);
}

export async function assignSystem(assignment) {
  const response = await apiClient.post("/access-assignments", assignment);
  return unwrapApiResponse(response);
}

export async function updateAssignment(id, assignment) {
  const response = await apiClient.put(`/access-assignments/${id}`, assignment);
  return unwrapApiResponse(response);
}

export async function revokeAssignment(id) {
  const response = await apiClient.patch(`/access-assignments/${id}/revoke`);
  return unwrapApiResponse(response);
}

export const accessAssignmentService = {
  listAssignments,
  getAssignmentDetails,
  assignSystem,
  updateAssignment,
  revokeAssignment,
};
