package com.onboardpro.employee.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public record PersonalDetailsRequest(
        @NotBlank String phoneNumber,
        @NotNull LocalDate dateOfBirth,
        @NotBlank String gender,
        @NotBlank String address,
        @NotBlank String emergencyContactName,
        @NotBlank String emergencyContactPhone
) {
}
