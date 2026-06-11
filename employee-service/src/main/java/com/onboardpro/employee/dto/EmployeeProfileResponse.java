package com.onboardpro.employee.dto;

public record EmployeeProfileResponse(
        Long id,
        String employeeCode,
        String fullName,
        String email,
        String phoneNumber,
        String role,
        String accountStatus
) {
}
