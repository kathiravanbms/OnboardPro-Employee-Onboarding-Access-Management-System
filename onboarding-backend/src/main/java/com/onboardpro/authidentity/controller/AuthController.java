package com.onboardpro.authidentity.controller;

import com.onboardpro.authidentity.dto.ApiResponse;
import com.onboardpro.authidentity.dto.LoginRequest;
import com.onboardpro.authidentity.dto.LoginResponse;
import com.onboardpro.authidentity.dto.RegisterRequest;
import com.onboardpro.authidentity.dto.TokenRefreshRequest;
import com.onboardpro.authidentity.dto.TokenResponse;
import com.onboardpro.authidentity.dto.UserResponse;
import com.onboardpro.authidentity.service.AuthService;
import com.onboardpro.authidentity.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.security.Principal;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Authentication", description = "Registration, login, refresh, and logout APIs")
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final UserService userService;

    @Operation(summary = "Register a new user")
    @PostMapping("/register")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<LoginResponse>> register(@Valid @RequestBody RegisterRequest request) {
        LoginResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("User registered successfully", response));
    }

    @Operation(summary = "Authenticate a user and issue JWT tokens")
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponse>> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Login successful", authService.login(request)));
    }

    @Operation(summary = "Refresh an access token")
    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<TokenResponse>> refresh(@Valid @RequestBody TokenRefreshRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Access token refreshed", authService.refreshToken(request)));
    }

    @Operation(summary = "Revoke all refresh tokens for the authenticated user")
    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(Principal principal) {
        // principal is null when the access token is already expired (JwtAuthFilter
        // does not set SecurityContext for expired tokens).  In that case the client
        // is effectively already logged out – just return 200 so it can clear storage.
        if (principal == null || principal.getName() == null) {
            return ResponseEntity.ok(ApiResponse.success("Logout successful", null));
        }
        try {
            UserResponse user = userService.getUserByEmail(principal.getName());
            authService.logout(user.getId());
        } catch (Exception ex) {
            // Best-effort: token already invalid or user not found – still return 200.
        }
        return ResponseEntity.ok(ApiResponse.success("Logout successful", null));
    }
}
