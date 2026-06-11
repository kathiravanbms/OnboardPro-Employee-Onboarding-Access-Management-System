package com.onboardpro.employee.dto;

import java.time.Instant;
import java.time.LocalDate;

public record AccessAssignmentResponse(
        Long id,
        Long accessRequestId,
        Long employeeId,
        String employeeCode,
        String employeeName,
        String employee,
        String employeeEmail,
        String email,
        String systemName,
        String system,
        String approvedBy,
        String priority,
        String status,
        String accessLevel,
        String notes,
        String credentials,
        LocalDate provisionedOn,
        Instant createdAt,
        Instant updatedAt
) {
}
