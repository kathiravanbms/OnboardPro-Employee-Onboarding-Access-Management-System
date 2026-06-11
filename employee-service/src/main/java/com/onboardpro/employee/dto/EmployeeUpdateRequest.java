package com.onboardpro.employee.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public record EmployeeUpdateRequest(
        @NotBlank String fullName,
        @NotBlank @Email String email,
        @NotBlank String departmentCode,
        @NotBlank String jobTitle,
        String managerName,
        @NotNull LocalDate startDate
) {
}
