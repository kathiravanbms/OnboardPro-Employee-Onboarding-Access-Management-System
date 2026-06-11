package com.onboardpro.employee.dto;

import com.onboardpro.employee.entity.OnboardingStatus;

public record OnboardingProgressResponse(
        Long employeeId,
        String employeeCode,
        OnboardingStatus status,
        int progress,
        long totalTasks,
        long completedTasks
) {
}
