package com.onboardpro.employee.dto;

public record ManagerReportResponse(
        long pendingTasks,
        long approved,
        long rejected,
        long pendingWork
) {
}
