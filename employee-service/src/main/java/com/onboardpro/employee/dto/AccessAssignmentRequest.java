package com.onboardpro.employee.dto;

public record AccessAssignmentRequest(
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
        String credentials
) {
}
