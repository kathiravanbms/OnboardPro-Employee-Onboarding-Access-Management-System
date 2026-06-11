package com.onboardpro.employee.dto;

public record ItProfileResponse(
        Long id,
        String employeeCode,
        String fullName,
        String email,
        String phoneNumber,
        String role
) {
}
