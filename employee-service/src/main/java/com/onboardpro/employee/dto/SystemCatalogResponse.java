package com.onboardpro.employee.dto;

import java.time.Instant;

public record SystemCatalogResponse(
        Long id,
        String name,
        String category,
        String description,
        String accessLevels,
        String owner,
        String status,
        String createdBy,
        String approvedBy,
        Instant approvedAt,
        String rejectionReason,
        long activeUsers,
        Instant createdAt,
        Instant updatedAt
) {
}
