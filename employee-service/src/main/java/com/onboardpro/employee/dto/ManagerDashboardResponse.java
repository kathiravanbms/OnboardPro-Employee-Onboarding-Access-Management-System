package com.onboardpro.employee.dto;

import java.time.Instant;
import java.util.List;

public record ManagerDashboardResponse(
        long teamMembers,
        long pendingApprovals,
        long approvedRequests,
        long rejectedRequests,
        List<RecentActivity> recentActivities
) {
    public record RecentActivity(
            Long id,
            String type,
            String message,
            Instant timestamp
    ) {
    }
}
