package com.onboardpro.employee.dto;

import jakarta.validation.constraints.NotNull;

public record TrainingCompletionRequest(@NotNull Long employeeId) {
}
