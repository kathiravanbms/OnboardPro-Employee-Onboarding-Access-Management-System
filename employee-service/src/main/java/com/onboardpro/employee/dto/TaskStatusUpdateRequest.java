package com.onboardpro.employee.dto;

import com.onboardpro.employee.entity.TaskStatus;
import jakarta.validation.constraints.NotNull;

public record TaskStatusUpdateRequest(@NotNull TaskStatus status) {
}
