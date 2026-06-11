package com.onboardpro.authidentity.dto;

import com.onboardpro.authidentity.domain.RoleName;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RegisterRequest {

    @NotBlank
    @Size(max = 80)
    private String username;

    @NotBlank
    @Email
    @Size(max = 160)
    private String email;

    @NotBlank
    @Size(min = 8, max = 100)
    private String password;

    private RoleName role = RoleName.ADMIN;

    private Boolean sendWelcomeEmail = false;
}
