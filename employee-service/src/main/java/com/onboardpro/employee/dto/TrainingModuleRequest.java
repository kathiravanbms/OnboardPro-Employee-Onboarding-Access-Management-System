package com.onboardpro.employee.dto;

import jakarta.validation.constraints.NotBlank;

public record TrainingModuleRequest(
        @NotBlank String title,
        @NotBlank String description,
        @NotBlank String videoUrl,
        @NotBlank String pdfUrl
) {
}
