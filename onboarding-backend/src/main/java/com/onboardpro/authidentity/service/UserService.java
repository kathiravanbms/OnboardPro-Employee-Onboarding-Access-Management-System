package com.onboardpro.authidentity.service;

import com.onboardpro.authidentity.domain.Role;
import com.onboardpro.authidentity.domain.RoleName;
import com.onboardpro.authidentity.domain.User;
import com.onboardpro.authidentity.dto.ChangePasswordRequest;
import com.onboardpro.authidentity.dto.UpdateProfileRequest;
import com.onboardpro.authidentity.dto.UserResponse;
import com.onboardpro.authidentity.exception.AuthException;
import com.onboardpro.authidentity.repository.RoleRepository;
import com.onboardpro.authidentity.repository.UserRepository;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final TokenService tokenService;

    @Transactional(readOnly = true)
    public UserResponse getUserById(UUID id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        return toUserResponse(user);
    }

    @Transactional(readOnly = true)
    public UserResponse getUserByEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        return toUserResponse(user);
    }

    @Transactional
    public UserResponse updateCurrentProfile(String email, UpdateProfileRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        String fullName = request.getFullName() == null ? "" : request.getFullName().trim();
        if (fullName.isBlank()) {
            throw new AuthException("Full name is required");
        }

        user.setUsername(fullName);
        user.setPhoneNumber(cleanNullable(request.getPhoneNumber()));
        User saved = userRepository.save(user);
        return toUserResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<UserResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::toUserResponse)
                .toList();
    }

    @Transactional
    public UserResponse updateUserRole(UUID userId, String role) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        RoleName roleName = parseRole(role);
        Role targetRole = roleRepository.findByRoleName(roleName)
                .orElseThrow(() -> new AuthException("Role not configured: " + roleName));
        user.assignRole(targetRole);
        return toUserResponse(user);
    }

    @Transactional
    public UserResponse deactivateUser(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        user.setIsActive(user.getIsActive() == null || !user.getIsActive());
        if (!Boolean.TRUE.equals(user.getIsActive())) {
            tokenService.revokeAllTokens(user);
        }
        return toUserResponse(user);
    }

    @Transactional
    public UserResponse deactivateUserByEmail(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        user.setIsActive(false);
        tokenService.revokeAllTokens(user);
        return toUserResponse(user);
    }

    @Transactional
    public void deleteUser(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        userRepository.delete(user);
    }

    @Transactional
    public void changePassword(String email, ChangePasswordRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new AuthException("Current password is incorrect");
        }

        if (passwordEncoder.matches(request.getNewPassword(), user.getPassword())) {
            throw new AuthException("New password must be different from current password");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    public UserResponse toUserResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .employeeId(user.getEmployeeId())
                .username(user.getUsername())
                .email(user.getEmail())
                .phoneNumber(user.getPhoneNumber())
                .isActive(user.getIsActive())
                .createdAt(user.getCreatedAt())
                .lastLogin(user.getLastLogin())
                .roles(user.getRoleMappings().stream()
                        .map(mapping -> mapping.getRole().getRoleName().name())
                        .toList())
                .build();
    }

    private RoleName parseRole(String role) {
        try {
            return RoleName.valueOf(role.trim().toUpperCase());
        } catch (RuntimeException ex) {
            throw new AuthException("Invalid role: " + role);
        }
    }

    private String cleanNullable(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
