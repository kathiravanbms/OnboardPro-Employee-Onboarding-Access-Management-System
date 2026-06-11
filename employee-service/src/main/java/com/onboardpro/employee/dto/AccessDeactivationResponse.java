package com.onboardpro.employee.dto;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

public record AccessDeactivationResponse(
        Long id,
        Long employeeDatabaseId,
        String employeeId,
        String employeeCode,
        String employeeName,
        String employee,
        String email,
        String department,
        LocalDate exitDate,
        String reason,
        List<String> systems,
        String notes,
        String requestedBy,
        String status,
        Instant deactivatedAt,
        Instant createdAt,
        Instant updatedAt
) {
}
