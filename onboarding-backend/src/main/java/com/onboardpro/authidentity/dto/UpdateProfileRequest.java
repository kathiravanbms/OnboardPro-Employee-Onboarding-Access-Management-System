package com.onboardpro.authidentity.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateProfileRequest {

    @NotBlank
    @Size(max = 80)
    private String fullName;

    @Pattern(regexp = "^$|^[+()\\-\\s0-9]{7,20}$", message = "Phone number must be 7 to 20 digits or symbols")
    private String phoneNumber;
}
