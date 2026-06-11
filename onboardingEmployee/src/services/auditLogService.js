import { apiClient, unwrapApiResponse } from "./apiClient";

function mapAuditLog(entry) {
  return {
    id: entry.auditId || entry.id,
    auditId: entry.auditId || entry.id,
    userId: entry.userId,
    user: entry.userName || entry.user || "System",
    userName: entry.userName || entry.user || "System",
    role: entry.role || "System",
    module: entry.module || "General",
    action: entry.action || "Action recorded",
    description: entry.description || "",
    targetEmployeeId: entry.targetEmployeeId,
    targetEmployeeName: entry.targetEmployeeName || "",
    timestamp: entry.timestamp || entry.createdAt || new Date().toISOString(),
  };
}

export const auditLogService = {
  async listAuditLogs() {
    const response = await apiClient.get("/audit-logs");
    return unwrapApiResponse(response).map(mapAuditLog);
  },

  async createAuditLog(payload) {
    const response = await apiClient.post("/audit-logs", payload);
    const data = unwrapApiResponse(response);
    return data ? mapAuditLog(data) : null;
  },
};
