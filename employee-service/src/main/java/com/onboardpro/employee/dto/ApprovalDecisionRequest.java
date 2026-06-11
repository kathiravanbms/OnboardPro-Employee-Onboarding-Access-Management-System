package com.onboardpro.employee.dto;

import com.onboardpro.employee.entity.ApprovalStatus;
import jakarta.validation.constraints.NotNull;

public record ApprovalDecisionRequest(
        @NotNull ApprovalStatus status,
        String remarks
) {
}
