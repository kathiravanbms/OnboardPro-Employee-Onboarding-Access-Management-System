import { apiClient, unwrapApiResponse } from "./apiClient";

function mapDeactivation(record) {
  return {
    ...record,
    employee: record.employeeName || record.employee || "",
    employeeId: record.employeeCode || record.employeeId || "",
    employeeCode: record.employeeCode || record.employeeId || "",
    deactivatedOn: record.deactivatedAt || record.deactivatedOn || "",
  };
}

function mapDeactivationPageRecord(record) {
  return {
    ...record,
    employeeDatabaseId: record.id,
    name: record.fullName || record.employeeName || record.employee || "",
    employee: record.fullName || record.employeeName || record.employee || "",
    employeeName: record.fullName || record.employeeName || record.employee || "",
    employeeId: record.employeeCode || String(record.id || ""),
    employeeCode: record.employeeCode || String(record.id || ""),
    department: record.departmentName || record.department || "",
    systems: record.systems || [],
    deactivatedAt: record.deactivatedOn || record.deactivatedAt || "",
    deactivatedOn: record.deactivatedOn || record.deactivatedAt || "",
    exitDate: record.exitDate || "",
    reason: record.reason || "",
    status: record.status || "",
  };
}

export async function listDeactivationRequests(params = {}) {
  const response = await apiClient.get("/access-deactivations", { params });
  return unwrapApiResponse(response).map(mapDeactivation);
}

export async function listActiveDeactivationCandidates() {
  const response = await apiClient.get("/access-deactivations/active");
  return unwrapApiResponse(response).map(mapDeactivationPageRecord);
}

export async function listDeactivatedEmployees() {
  const response = await apiClient.get("/access-deactivations/deactivated");
  return unwrapApiResponse(response).map(mapDeactivationPageRecord);
}

export async function loadEmployeeSystems(employeeId) {
  const response = await apiClient.get(`/access-deactivations/employees/${employeeId}/systems`);
  return unwrapApiResponse(response);
}

export async function createDeactivationRequest(request) {
  const response = await apiClient.post("/access-deactivations", request);
  return mapDeactivation(unwrapApiResponse(response));
}

export async function deactivateAssignedSystems(id, systems) {
  const response = await apiClient.patch(`/access-deactivations/${id}/systems/deactivate`, { systems });
  return mapDeactivation(unwrapApiResponse(response));
}

export async function completeDeactivationRequest(id) {
  const response = await apiClient.patch(`/access-deactivations/${id}/complete`);
  return mapDeactivation(unwrapApiResponse(response));
}

export const accessDeactivationService = {
  listDeactivationRequests,
  listActiveDeactivationCandidates,
  listDeactivatedEmployees,
  loadEmployeeSystems,
  createDeactivationRequest,
  deactivateAssignedSystems,
  completeDeactivationRequest,
};
