package com.onboardpro.employee.dto;

public record AccessAssignmentDetailsResponse(
        Long id,
        String employeeName,
        String employeeEmail,
        String systemName,
        String username,
        String temporaryPassword,
        String accessLevel,
        String notes
) {
}
