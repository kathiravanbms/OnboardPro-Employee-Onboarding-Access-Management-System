package com.onboardpro.employee.dto;

public record DashboardSummaryDTO(
        long totalUsers,
        long activeEmployees,
        long pendingTasks,
        long notificationCount
) {
}
