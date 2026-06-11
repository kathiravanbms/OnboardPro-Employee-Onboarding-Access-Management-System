package com.onboardpro.employee.dto;

import java.time.Instant;

public record TrainingModuleResponse(
        Long id,
        String title,
        String description,
        String videoUrl,
        String pdfUrl,
        Instant uploadDate,
        boolean completed,
        Instant completedAt
) {
}
