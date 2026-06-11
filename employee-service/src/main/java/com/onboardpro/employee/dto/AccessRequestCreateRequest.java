package com.onboardpro.employee.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record AccessRequestCreateRequest(
        @NotNull String employeeId,
        Long systemCatalogId,
        @NotBlank String systemName,
        String justification
) {
}
