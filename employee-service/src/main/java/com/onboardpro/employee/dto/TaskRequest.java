package com.onboardpro.employee.dto;

import com.onboardpro.employee.entity.RoleName;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public record TaskRequest(
        @NotNull Long employeeId,
        @NotBlank String title,
        String description,
        @NotNull RoleName assignedRole,
        LocalDate dueDate
) {
}
