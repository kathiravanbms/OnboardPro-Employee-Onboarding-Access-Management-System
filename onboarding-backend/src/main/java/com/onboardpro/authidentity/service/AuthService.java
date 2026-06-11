package com.onboardpro.authidentity.service;

import com.onboardpro.authidentity.domain.RefreshToken;
import com.onboardpro.authidentity.domain.Role;
import com.onboardpro.authidentity.domain.RoleName;
import com.onboardpro.authidentity.domain.User;
import com.onboardpro.authidentity.config.EmailService;
import com.onboardpro.authidentity.dto.LoginRequest;
import com.onboardpro.authidentity.dto.LoginResponse;
import com.onboardpro.authidentity.dto.RegisterRequest;
import com.onboardpro.authidentity.dto.TokenRefreshRequest;
import com.onboardpro.authidentity.dto.TokenResponse;
import com.onboardpro.authidentity.exception.AuthException;
import com.onboardpro.authidentity.exception.TokenExpiredException;
import com.onboardpro.authidentity.repository.RoleRepository;
import com.onboardpro.authidentity.repository.UserRepository;
import com.onboardpro.authidentity.security.JwtUtil;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;
    private final TokenService tokenService;
    private final EmailService emailService;
    private final PlatformSettingsService platformSettingsService;

    @Transactional
    public synchronized LoginResponse register(RegisterRequest request) {
        if (userRepository.existsByEmailIgnoreCase(request.getEmail())) {
            throw new AuthException("Email already registered");
        }

        RoleName targetRoleName = request.getRole() != null ? request.getRole() : RoleName.ADMIN;
        Role role = roleRepository.findByRoleName(targetRoleName)
                .orElseThrow(() -> new AuthException("Role not configured: " + targetRoleName));
        boolean autoAssignEmployeeIds = platformSettingsService.isAutoAssignEmployeeIdsEnabled();
        String employeeId = targetRoleName == RoleName.ADMIN || !autoAssignEmployeeIds ? null : nextEmployeeId();

        User user = User.builder()
                .id(UUID.randomUUID())
                .username(request.getUsername().trim())
                .employeeId(employeeId)
                .email(request.getEmail().trim().toLowerCase())
                .password(passwordEncoder.encode(request.getPassword()))
                .isActive(true)
                .createdAt(Instant.now())
                .build();
        user.assignRole(role);
        User savedUser = userRepository.saveAndFlush(user);
        log.info("User saved successfully before welcome email. email={}, role={}, employeeId={}",
                savedUser.getEmail(), targetRoleName.name(), savedUser.getEmployeeId() == null ? "<none>" : savedUser.getEmployeeId());

        UserDetails userDetails = org.springframework.security.core.userdetails.User.builder()
                .username(savedUser.getEmail())
                .password(savedUser.getPassword())
                .authorities(roles(savedUser).stream().map(roleName -> "ROLE_" + roleName).toArray(String[]::new))
                .build();
        String accessToken = jwtUtil.generateAccessToken(userDetails, savedUser.getId());
        String refreshToken = jwtUtil.generateRefreshToken(savedUser.getId());
        tokenService.saveRefreshToken(savedUser, refreshToken, jwtUtil.refreshTokenExpiry());

        boolean welcomeEmailSent = false;
        String welcomeEmailMessage = null;
        boolean emailNotificationsEnabled = platformSettingsService.isEmailNotificationsEnabled();
        if (Boolean.TRUE.equals(request.getSendWelcomeEmail()) && emailNotificationsEnabled) {
            log.info("Welcome email requested after user save. email={}", savedUser.getEmail());
            if (!emailService.isMailConfigured()) {
                welcomeEmailMessage = "User created, but Gmail SMTP is not configured. Set ONBOARDPRO_MAIL_USERNAME and ONBOARDPRO_MAIL_PASSWORD to send the welcome email.";
                log.warn("Welcome email skipped for {} because SMTP is not configured", savedUser.getEmail());
            } else {
                try {
                    emailService.sendWelcomeEmail(
                            savedUser.getEmail(),
                            savedUser.getUsername(),
                            request.getPassword(),
                            targetRoleName.name(),
                            savedUser.getEmployeeId()
                    );
                    welcomeEmailSent = true;
                    welcomeEmailMessage = "User created and welcome email sent successfully.";
                } catch (IllegalStateException ex) {
                    welcomeEmailMessage = "User created, but the welcome email could not be sent. " + ex.getMessage();
                    log.warn("Welcome email failed for {}", savedUser.getEmail(), ex);
                }
            }
        } else if (Boolean.TRUE.equals(request.getSendWelcomeEmail())) {
            welcomeEmailMessage = "User created, but email notifications are disabled in platform settings.";
        }

        log.info("Registered user {}", savedUser.getEmail());
        return buildLoginResponse(savedUser, accessToken, refreshToken, welcomeEmailSent, welcomeEmailMessage);
    }

    @Transactional
    public LoginResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail().trim().toLowerCase())
                .orElseThrow(() -> new BadCredentialsException("Invalid email or password"));
        ensureActive(user);
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getEmail().trim().toLowerCase(), request.getPassword())
            );
            String accessToken = jwtUtil.generateAccessToken((UserDetails) authentication.getPrincipal(), user.getId());
            String refreshToken = jwtUtil.generateRefreshToken(user.getId());
            tokenService.saveRefreshToken(user, refreshToken, jwtUtil.refreshTokenExpiry());
            user.setLastLogin(Instant.now());
            User savedUser = userRepository.save(user);
            log.info("Login successful for {}", savedUser.getEmail());
            return buildLoginResponse(savedUser, accessToken, refreshToken);
        } catch (BadCredentialsException ex) {
            log.warn("Login failed for {}", request.getEmail());
            throw ex;
        }
    }

    @Transactional
    public TokenResponse refreshToken(TokenRefreshRequest request) {
        RefreshToken refreshToken = tokenService.findByToken(request.getRefreshToken())
                .orElseThrow(() -> new AuthException("Refresh token not found"));

        if (Boolean.TRUE.equals(refreshToken.getIsRevoked())) {
            throw new AuthException("Refresh token revoked");
        }
        if (refreshToken.getExpiryDate().isBefore(Instant.now()) || jwtUtil.isTokenExpired(refreshToken.getToken())) {
            throw new TokenExpiredException("Token expired");
        }

        UUID tokenUserId = jwtUtil.extractUserId(refreshToken.getToken());
        if (!refreshToken.getUser().getId().equals(tokenUserId)) {
            throw new AuthException("Refresh token user mismatch");
        }

        User user = userRepository.findById(tokenUserId)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        ensureActive(user);
        UserDetails userDetails = org.springframework.security.core.userdetails.User.builder()
                .username(user.getEmail())
                .password(user.getPassword())
                .disabled(!Boolean.TRUE.equals(user.getIsActive()))
                .authorities(roles(user).stream().map(roleName -> "ROLE_" + roleName).toArray(String[]::new))
                .build();
        return TokenResponse.builder()
                .accessToken(jwtUtil.generateAccessToken(userDetails, user.getId()))
                .build();
    }

    @Transactional
    public void logout(UUID userId) {
        tokenService.revokeAllTokens(userId);
        log.info("Revoked refresh tokens for user {}", userId);
    }

    private LoginResponse buildLoginResponse(User user, String accessToken, String refreshToken) {
        return buildLoginResponse(user, accessToken, refreshToken, null, null);
    }

    private LoginResponse buildLoginResponse(User user, String accessToken, String refreshToken, Boolean welcomeEmailSent, String welcomeEmailMessage) {
        return LoginResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .userId(user.getId())
                .employeeId(user.getEmployeeId())
                .email(user.getEmail())
                .roles(roles(user))
                .welcomeEmailSent(welcomeEmailSent)
                .welcomeEmailMessage(welcomeEmailMessage)
                .build();
    }

    private List<String> roles(User user) {
        return user.getRoleMappings().stream()
                .map(mapping -> mapping.getRole().getRoleName().name())
                .toList();
    }

    private String nextEmployeeId() {
        Integer maxEmployeeIdNumber = userRepository.findMaxEmployeeIdNumber();
        int nextNumber = Math.max(maxEmployeeIdNumber == null ? 1000 : maxEmployeeIdNumber, 1000) + 1;
        return "EMP" + nextNumber;
    }

    private void ensureActive(User user) {
        if (!Boolean.TRUE.equals(user.getIsActive())) {
            tokenService.revokeAllTokens(user);
            throw new AuthException("Your account has been deactivated. Please contact IT.");
        }
    }
}
