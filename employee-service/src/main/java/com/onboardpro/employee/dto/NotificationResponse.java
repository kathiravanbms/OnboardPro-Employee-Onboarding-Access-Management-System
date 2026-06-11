package com.onboardpro.employee.dto;

import java.time.Instant;

public record NotificationResponse(
        Long id,
        Long employeeId,
        Long recipientUserId,
        Long requestId,
        String recipientEmail,
        String recipientRole,
        String notificationType,
        String title,
        String message,
        boolean read,
        Instant readAt,
        Instant createdAt
) {
}
