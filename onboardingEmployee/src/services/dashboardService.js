import { apiClient, unwrapApiResponse } from "./apiClient";

export async function getAdminDashboardSummary() {
  const response = await apiClient.get("/admin/dashboard-summary");
  return unwrapApiResponse(response);
}

export async function getHrDashboardSummary() {
  const response = await apiClient.get("/hr/dashboard-summary");
  return unwrapApiResponse(response);
}

export async function getManagerDashboard() {
  const response = await apiClient.get("/manager/dashboard");
  return unwrapApiResponse(response);
}

export const dashboardService = {
  getAdminDashboardSummary,
  getHrDashboardSummary,
  getManagerDashboard,
};
