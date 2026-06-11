package com.onboardpro.employee.dto;

import java.time.Instant;
import java.util.List;

public record ItDashboardResponse(
        long queuedRequests,
        long provisionedToday,
        long pendingProvisioning,
        long deactivationsPending,
        List<AccessQueuePreview> accessQueuePreview,
        List<RecentActivity> recentActivities
) {
    public record AccessQueuePreview(
            String employeeName,
            String systemName,
            String status,
            String priority,
            String approvedBy
    ) {
    }

    public record RecentActivity(
            Instant timestamp,
            String action,
            String module
    ) {
    }
}
