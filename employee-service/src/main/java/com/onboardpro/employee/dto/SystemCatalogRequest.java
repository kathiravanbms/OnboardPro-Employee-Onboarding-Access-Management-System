package com.onboardpro.employee.dto;

import jakarta.validation.constraints.NotBlank;

public record SystemCatalogRequest(
        @NotBlank String name,
        @NotBlank String category,
        @NotBlank String description,
        @NotBlank String accessLevels,
        @NotBlank String owner,
        String status,
        String rejectionReason
) {
}
