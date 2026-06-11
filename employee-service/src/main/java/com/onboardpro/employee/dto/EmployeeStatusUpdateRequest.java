package com.onboardpro.employee.dto;

import com.onboardpro.employee.entity.EmployeeStatus;
import jakarta.validation.constraints.NotNull;

public record EmployeeStatusUpdateRequest(@NotNull EmployeeStatus status) {
}
