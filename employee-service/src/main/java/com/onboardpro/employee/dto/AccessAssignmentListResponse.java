package com.onboardpro.employee.dto;

import java.time.LocalDate;

public record AccessAssignmentListResponse(
        Long id,
        String employeeName,
        String employeeEmail,
        String systemName,
        String approvedBy,
        String priority,
        String status,
        LocalDate provisionedOn
) {
}
