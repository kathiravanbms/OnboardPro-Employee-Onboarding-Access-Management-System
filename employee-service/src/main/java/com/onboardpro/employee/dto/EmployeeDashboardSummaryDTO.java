package com.onboardpro.employee.dto;

public record EmployeeDashboardSummaryDTO(
        String employeeName,
        int onboardingProgress,
        long completedTasks,
        long totalTasks,
        long pendingTasks,
        long documentCount,
        long verifiedDocuments,
        long accessRequests,
        long accessRequestCount,
        long notificationCount,
        boolean trainingCompleted
) {
}
