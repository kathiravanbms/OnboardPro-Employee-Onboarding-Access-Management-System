import { apiClient, unwrapApiResponse } from "./apiClient";

export async function getHrOnboardingCompletionReport() {
  const response = await apiClient.get("/hr/reports/onboarding-completion");
  return unwrapApiResponse(response);
}

export async function getHrDocumentVerificationReport() {
  const response = await apiClient.get("/hr/reports/document-verification");
  return unwrapApiResponse(response);
}

export async function getHrPendingTasksReport() {
  const response = await apiClient.get("/hr/reports/pending-tasks");
  return unwrapApiResponse(response);
}

export async function getManagerPendingTasksReport() {
  const response = await apiClient.get("/reports/pending-tasks");
  return unwrapApiResponse(response);
}

export async function getManagerApprovalsReport() {
  const response = await apiClient.get("/reports/approvals");
  return unwrapApiResponse(response);
}

export async function getManagerReport() {
  const response = await apiClient.get("/reports/manager");
  return unwrapApiResponse(response);
}

export const reportService = {
  getHrOnboardingCompletionReport,
  getHrDocumentVerificationReport,
  getHrPendingTasksReport,
  getManagerPendingTasksReport,
  getManagerApprovalsReport,
  getManagerReport,
};
