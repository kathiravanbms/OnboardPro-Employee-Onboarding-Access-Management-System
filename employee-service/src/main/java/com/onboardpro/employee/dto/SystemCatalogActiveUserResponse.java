package com.onboardpro.employee.dto;

import java.time.Instant;
import java.time.LocalDate;

public record SystemCatalogActiveUserResponse(
        Long assignmentId,
        Long employeeId,
        String employeeCode,
        String employeeName,
        String email,
        String department,
        String role,
        String accessStatus,
        String employeeStatus,
        LocalDate provisionedDate,
        Instant assignedAt,
        String accessLevel,
        String approvedBy,
        String systemName
) {
}
