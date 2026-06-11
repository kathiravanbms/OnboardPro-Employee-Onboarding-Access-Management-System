import { apiClient, unwrapApiResponse } from "./apiClient";

function mapApproval(approval) {
  return {
    raw: approval,
    id: approval.id,
    employeeDatabaseId: approval.employeeId,
    employeeId: approval.employeeCode || String(approval.employeeId),
    employeeName: approval.employeeName,
    approvalType: approval.approvalType,
    status: approval.status,
    requestedBy: approval.requestedBy,
    approver: approval.approver,
    remark: approval.remarks || "",
    remarks: approval.remarks || "",
    decidedAt: approval.decidedAt,
    submittedOn: approval.createdAt,
    createdAt: approval.createdAt,
    updatedAt: approval.updatedAt,
  };
}

export async function listApprovals(employeeId) {
  const response = employeeId
    ? await apiClient.get(`/approvals/${employeeId}`)
    : await apiClient.get("/approvals");
  return unwrapApiResponse(response).map(mapApproval);
}

export async function approveManagerOnboarding(employeeId, remarks) {
  const response = await apiClient.post("/approvals/approve", { employeeId, remarks });
  return mapApproval(unwrapApiResponse(response));
}

export async function rejectManagerOnboarding(employeeId, remarks) {
  const response = await apiClient.post("/approvals/reject", { employeeId, remarks });
  return mapApproval(unwrapApiResponse(response));
}

export const approvalService = {
  listApprovals,
  approveManagerOnboarding,
  rejectManagerOnboarding,
};
