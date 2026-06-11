package com.onboardpro.authidentity.controller;

import com.onboardpro.authidentity.dto.ApiResponse;
import com.onboardpro.authidentity.dto.ChangePasswordRequest;
import com.onboardpro.authidentity.dto.UpdateRoleRequest;
import com.onboardpro.authidentity.dto.UpdateProfileRequest;
import com.onboardpro.authidentity.dto.UserResponse;
import com.onboardpro.authidentity.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.security.Principal;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Users", description = "Authenticated user profile and administrative user management APIs")
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @Operation(summary = "Get current authenticated user profile")
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserResponse>> me(Principal principal) {
        return ResponseEntity.ok(ApiResponse.success("User profile fetched", userService.getUserByEmail(principal.getName())));
    }

    @Operation(summary = "Update current authenticated user profile")
    @PutMapping("/me/profile")
    public ResponseEntity<ApiResponse<UserResponse>> updateProfile(
            Principal principal,
            @Valid @RequestBody UpdateProfileRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success("User profile updated", userService.updateCurrentProfile(principal.getName(), request)));
    }

    @Operation(summary = "Change current user's password")
    @PutMapping("/me/password")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            Principal principal,
            @Valid @RequestBody ChangePasswordRequest request
    ) {
        userService.changePassword(principal.getName(), request);
        return ResponseEntity.ok(ApiResponse.success("Password updated successfully", null));
    }

    @Operation(summary = "List all users")
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<UserResponse>>> getAllUsers() {
        return ResponseEntity.ok(ApiResponse.success("Users fetched", userService.getAllUsers()));
    }

    @Operation(summary = "Update a user's role")
    @PutMapping("/{id}/role")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<UserResponse>> updateRole(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateRoleRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success("User role updated", userService.updateUserRole(id, request.getRole())));
    }

    @Operation(summary = "Toggle user active status")
    @PutMapping("/{id}/deactivate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<UserResponse>> deactivate(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success("User status toggled", userService.deactivateUser(id)));
    }

    @Operation(summary = "Deactivate a user by email and revoke active sessions")
    @PutMapping("/by-email/{email}/deactivate")
    @PreAuthorize("hasAnyRole('ADMIN','IT_ADMIN')")
    public ResponseEntity<ApiResponse<UserResponse>> deactivateByEmail(@PathVariable String email) {
        return ResponseEntity.ok(ApiResponse.success("User deactivated", userService.deactivateUserByEmail(email)));
    }

    @Operation(summary = "Delete a user")
    @org.springframework.web.bind.annotation.DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        userService.deleteUser(id);
        return ResponseEntity.ok(ApiResponse.success("User deleted", null));
    }
}
