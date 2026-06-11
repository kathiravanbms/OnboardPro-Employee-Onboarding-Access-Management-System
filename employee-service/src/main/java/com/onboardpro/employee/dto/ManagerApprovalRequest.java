package com.onboardpro.employee.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.NotBlank;

public record ManagerApprovalRequest(
        @NotNull Long employeeId,
        @NotBlank String remarks
) {
}
