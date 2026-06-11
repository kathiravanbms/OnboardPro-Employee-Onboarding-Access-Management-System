package com.onboardpro.employee.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record EmployeeProfileUpdateRequest(
        @NotBlank @Size(max = 120) String fullName,
        @Pattern(regexp = "^$|^[+()\\-\\s0-9]{7,20}$", message = "Phone number must be 7 to 20 digits or symbols")
        String phoneNumber
) {
}
