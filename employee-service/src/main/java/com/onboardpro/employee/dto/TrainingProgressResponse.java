package com.onboardpro.employee.dto;

import java.util.List;

public record TrainingProgressResponse(
        Long employeeId,
        String employeeCode,
        String employeeName,
        String trainingStatus,
        int trainingProgress,
        long totalModules,
        long completedModules,
        List<TrainingModuleResponse> modules
) {
}
