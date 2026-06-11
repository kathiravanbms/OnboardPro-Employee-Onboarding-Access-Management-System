package com.onboardpro.authidentity.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ForgotPasswordRequest {

    // Email address entered by the user on the forgot-password page.
    @NotBlank
    @Email
    private String email;
}
