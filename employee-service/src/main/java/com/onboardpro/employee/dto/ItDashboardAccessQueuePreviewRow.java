package com.onboardpro.employee.dto;

public record ItDashboardAccessQueuePreviewRow(
        String employeeName,
        String systemName,
        String status,
        String priority,
        String approvedBy
) {
}
