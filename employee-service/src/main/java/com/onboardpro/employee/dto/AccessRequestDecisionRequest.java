package com.onboardpro.employee.dto;

import com.onboardpro.employee.entity.AccessRequestStatus;
import jakarta.validation.constraints.NotNull;

public record AccessRequestDecisionRequest(
        @NotNull AccessRequestStatus status,
        String remarks
) {
}
