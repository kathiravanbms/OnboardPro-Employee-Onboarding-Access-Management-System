package com.onboardpro.employee.dto;

import com.onboardpro.employee.entity.AccessRequestStatus;
import java.time.Instant;
import java.time.LocalDate;

public record AccessRequestResponse(
        Long id,
        Long employeeId,
        String employeeCode,
        Long systemCatalogId,
        String systemName,
        String systemCategory,
        String justification,
        AccessRequestStatus status,
        String requestedBy,
        String approvedBy,
        String provisionedBy,
        String remarks,
        Instant decidedAt,
        Instant provisionedAt,
        Instant createdAt,
        Instant updatedAt,
        String credentials,
        LocalDate provisionedOn
) {
}
