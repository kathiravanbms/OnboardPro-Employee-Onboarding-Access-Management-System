package com.onboardpro.employee.dto;

import com.onboardpro.employee.entity.ApprovalType;
import jakarta.validation.constraints.NotNull;

public record ApprovalRequest(
        @NotNull Long employeeId,
        @NotNull ApprovalType approvalType,
        String remarks
) {
}
