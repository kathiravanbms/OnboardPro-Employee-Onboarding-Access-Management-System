package com.onboardpro.employee.dto;

import com.onboardpro.employee.entity.OnboardingStatus;
import java.time.Instant;
import java.time.LocalDate;

public record HrOnboardingCompletionReportRowDTO(
        String employeeCode,
        String employeeName,
        String email,
        String department,
        OnboardingStatus onboardingStatus,
        int progress,
        LocalDate startDate,
        Instant lastUpdatedAt
) {
}
