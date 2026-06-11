package com.onboardpro.employee.dto;

public record ReportSummaryResponse(
        long totalEmployees,
        long activeEmployees,
        long completedOnboardings,
        long pendingTasks,
        long pendingApprovals
) {
}
