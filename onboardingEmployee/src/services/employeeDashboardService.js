import { apiClient, unwrapApiResponse } from "./apiClient";

let dashboardSummaryCache = null;
let dashboardSummaryRequest = null;

export async function getEmployeeDashboardSummary({ forceRefresh = false } = {}) {
  if (!forceRefresh && dashboardSummaryCache) {
    return dashboardSummaryCache;
  }

  if (!forceRefresh && dashboardSummaryRequest) {
    return dashboardSummaryRequest;
  }

  dashboardSummaryRequest = apiClient.get("/employee/dashboard-summary")
    .then((response) => {
      dashboardSummaryCache = unwrapApiResponse(response);
      return dashboardSummaryCache;
    })
    .finally(() => {
      dashboardSummaryRequest = null;
    });

  return dashboardSummaryRequest;
}

export function clearEmployeeDashboardSummaryCache() {
  dashboardSummaryCache = null;
  dashboardSummaryRequest = null;
}

export const employeeDashboardService = {
  getEmployeeDashboardSummary,
  clearEmployeeDashboardSummaryCache,
};
