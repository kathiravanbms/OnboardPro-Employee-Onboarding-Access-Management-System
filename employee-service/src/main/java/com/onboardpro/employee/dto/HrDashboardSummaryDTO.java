package com.onboardpro.employee.dto;

import java.time.Instant;
import java.util.List;

public record HrDashboardSummaryDTO(
        long totalEmployees,
        long activeOnboardings,
        long docsPendingVerification,
        long completedThisMonth,
        LifecycleDTO lifecycle,
        List<RecentActivityDTO> recentActivities
) {
    public record LifecycleDTO(
            long initiated,
            long inProgress,
            long pendingApproval,
            long completed
    ) {
    }

    public record RecentActivityDTO(
            Long id,
            String message,
            String module,
            Instant timestamp
    ) {
    }
}
