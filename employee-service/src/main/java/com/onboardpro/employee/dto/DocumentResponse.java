package com.onboardpro.employee.dto;

import com.onboardpro.employee.entity.DocumentStatus;
import java.time.Instant;

public record DocumentResponse(
        Long id,
        Long employeeId,
        String employeeCode,
        String documentType,
        String fileName,
        String storageUrl,
        String contentType,
        Long fileSize,
        DocumentStatus status,
        String reviewComment,
        String reviewedBy,
        Instant reviewedAt,
        Instant createdAt,
        Instant updatedAt
) {
}
