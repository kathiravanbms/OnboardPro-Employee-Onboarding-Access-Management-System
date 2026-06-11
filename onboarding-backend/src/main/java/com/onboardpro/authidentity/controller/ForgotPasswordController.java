package com.onboardpro.authidentity.controller;

import com.onboardpro.authidentity.dto.ForgotPasswordRequest;
import com.onboardpro.authidentity.dto.ResetPasswordRequest;
import com.onboardpro.authidentity.service.ForgotPasswordService;
import jakarta.validation.Valid;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class ForgotPasswordController {

    private final ForgotPasswordService forgotPasswordService;

    // Public endpoint that accepts an email and sends a password reset link.
    @PostMapping("/forgot-password")
    public ResponseEntity<Map<String, String>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        // Call the service to verify the email, create the token, and send the email.
        String message = forgotPasswordService.sendResetLink(request.getEmail());

        // Return the success response expected by the frontend.
        return ResponseEntity.status(HttpStatus.OK).body(Map.of("message", message));
    }

    // Public endpoint that accepts a reset token and the user's new password.
    @PostMapping("/reset-password")
    public ResponseEntity<Map<String, String>> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        // Call the service to validate the token and update the encrypted password.
        String message = forgotPasswordService.resetPassword(request.getToken(), request.getNewPassword());

        // Return the success response expected by the frontend.
        return ResponseEntity.status(HttpStatus.OK).body(Map.of("message", message));
    }
}
