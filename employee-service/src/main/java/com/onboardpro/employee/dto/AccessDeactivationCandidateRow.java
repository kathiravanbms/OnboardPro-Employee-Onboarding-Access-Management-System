package com.onboardpro.employee.dto;

public record AccessDeactivationCandidateRow(
        Long id,
        String employeeCode,
        String fullName,
        String departmentName,
        String systemName
) {
}
