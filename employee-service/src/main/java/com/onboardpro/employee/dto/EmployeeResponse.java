package com.onboardpro.employee.dto;

import com.onboardpro.employee.entity.EmployeeStatus;
import com.onboardpro.employee.entity.OnboardingStatus;
import java.time.Instant;
import java.time.LocalDate;

public record EmployeeResponse(
        Long id,
        String employeeCode,
        String fullName,
        String email,
        String departmentCode,
        String departmentName,
        String jobTitle,
        String managerName,
        LocalDate startDate,
        String phoneNumber,
        LocalDate dateOfBirth,
        String gender,
        String address,
        String emergencyContactName,
        String emergencyContactPhone,
        boolean policyConductAcknowledged,
        boolean policyWorkingHoursAcknowledged,
        boolean policyAntiHarassmentAcknowledged,
        boolean policyDataSecurityAcknowledged,
        boolean policyHealthSafetyAcknowledged,
        EmployeeStatus status,
        OnboardingStatus onboardingStatus,
        int onboardingProgress,
        Instant createdAt,
        Instant updatedAt
) {
}
