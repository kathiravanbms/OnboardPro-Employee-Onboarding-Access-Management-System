package com.onboardpro.employee.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.util.List;

public record AccessDeactivationRequest(
        Long employeeId,
        String employeeCode,
        @NotBlank String employeeName,
        String employee,
        @Email @NotBlank String email,
        @NotBlank String department,
        @NotNull LocalDate exitDate,
        @NotBlank String reason,
        @NotEmpty List<String> systems,
        @NotBlank String notes,
        String requestedBy
) {
}

