package com.onboardpro.employee.dto;

import com.onboardpro.employee.entity.RoleName;
import com.onboardpro.employee.entity.TaskStatus;
import java.time.Instant;
import java.time.LocalDate;

public record TaskResponse(
        Long id,
        Long employeeId,
        String employeeCode,
        String title,
        String description,
        RoleName assignedRole,
        TaskStatus status,
        LocalDate dueDate,
        Instant completedAt,
        Instant createdAt,
        Instant updatedAt
) {
}
