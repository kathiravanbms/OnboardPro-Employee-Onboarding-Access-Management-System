package com.onboardpro.employee.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record DocumentRequest(
        @NotNull Long employeeId,
        @NotBlank String documentType,
        @NotBlank String fileName,
        @NotBlank String storageUrl,
        String contentType,
        Long fileSize
) {
}
