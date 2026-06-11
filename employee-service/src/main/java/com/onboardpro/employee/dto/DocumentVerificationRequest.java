package com.onboardpro.employee.dto;

import com.onboardpro.employee.entity.DocumentStatus;
import jakarta.validation.constraints.NotNull;

public record DocumentVerificationRequest(
        @NotNull DocumentStatus status,
        String reviewComment
) {
}
