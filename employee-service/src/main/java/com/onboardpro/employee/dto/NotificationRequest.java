package com.onboardpro.employee.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record NotificationRequest(
        Long employeeId,
        Long recipientUserId,
        @NotBlank @Email String recipientEmail,
        @NotBlank String recipientRole,
        @NotBlank String title,
        @NotBlank String message
) {
}
