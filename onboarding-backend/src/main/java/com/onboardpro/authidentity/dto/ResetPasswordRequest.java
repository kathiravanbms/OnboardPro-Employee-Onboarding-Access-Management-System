package com.onboardpro.authidentity.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ResetPasswordRequest {

    // Secure raw token from the reset-password email link.
    @NotBlank
    private String token;

    // New password that will be encrypted and saved for the user.
    @NotBlank
    @Size(min = 8, max = 100)
    private String newPassword;
}
