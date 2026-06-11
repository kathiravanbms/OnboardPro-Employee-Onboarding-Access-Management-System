package com.onboardpro.authidentity.service;

import com.onboardpro.authidentity.config.EmailService;
import com.onboardpro.authidentity.domain.PasswordResetToken;
import com.onboardpro.authidentity.domain.User;
import com.onboardpro.authidentity.exception.AuthException;
import com.onboardpro.authidentity.repository.PasswordResetTokenRepository;
import com.onboardpro.authidentity.repository.UserRepository;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class ForgotPasswordService {

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    @Value("${app.reset.password.url}")
    private String resetPasswordUrl;

    private static final String RESET_RESPONSE = "If that email exists in our records, a password reset link has been dispatched.";

    // Creates a new password reset token and emails the reset link to the user.
    @Transactional
    public String sendResetLink(String email) {
        // Normalize the email so lookup, token storage, and login all use the same value.
        String normalizedEmail = email.trim().toLowerCase();

        User user = userRepository.findByEmail(normalizedEmail).orElse(null);
        if (user == null) {
            log.info("Password reset requested for non-existing email. email={}", normalizedEmail);
            return RESET_RESPONSE;
        }

        Instant now = Instant.now();

        // Clean up expired links only. Still-valid reset links must remain usable until reset succeeds.
        passwordResetTokenRepository.deleteByEmailAndExpiryTimeBefore(normalizedEmail, now);

        // Generate a secure random token for the reset email link and store only its hash.
        String token = generateSecureToken();
        String tokenHash = hashToken(token);

        // Set the token expiry time to 15 minutes from now.
        Instant expiryTime = now.plus(15, ChronoUnit.MINUTES);

        // Save the reset token row in the password_reset_tokens table.
        PasswordResetToken resetToken = PasswordResetToken.builder()
                .email(normalizedEmail)
                .token(tokenHash)
                .expiryTime(expiryTime)
                .isUsed(false)
                .build();
        passwordResetTokenRepository.save(resetToken);
        log.info("Reset token generated. email={}, tokenHash={}, expiryTime={}",
                normalizedEmail, tokenHash, expiryTime);

        // Build the frontend reset link with the token as a query parameter.
        String resetLink = resetPasswordUrl + "?token=" + token;
        log.info("Reset URL generated. email={}, resetLink={}", normalizedEmail, resetLink);

        // Send the reset link to the user by email.
        emailService.sendResetEmail(normalizedEmail, resetLink);

        // Return a clear success message for the API response.
        return RESET_RESPONSE;
    }

    // Validates the reset token and updates the user's password.
    @Transactional
    public String resetPassword(String token, String newPassword) {
        validatePasswordStrength(newPassword);

        String cleanToken = token == null ? "" : token.trim();
        String tokenHash = hashToken(cleanToken);
        log.info("Received reset token: {}", cleanToken);
        log.info("Received reset token hash: {}", tokenHash);

        // Find the token in the password_reset_tokens table.
        PasswordResetToken resetToken = passwordResetTokenRepository.findByToken(tokenHash).orElse(null);
        boolean tokenFound = resetToken != null;
        log.info("Token found: {}", tokenFound);
        if (!tokenFound) {
            log.warn("Reset token invalid");
            throw new AuthException("Invalid reset link");
        }

        // Stop the reset if this token was already consumed.
        if (resetToken.isUsed()) {
            log.warn("Reset token already used. email={}", resetToken.getEmail());
            throw new AuthException("Reset link already used");
        }

        // Stop the reset if the token expiry time has already passed.
        Instant now = Instant.now();
        log.info("Reset token expiry check. email={}, expiryTime={}, now={}",
                resetToken.getEmail(), resetToken.getExpiryTime(), now);
        if (resetToken.getExpiryTime().isBefore(now)) {
            log.warn("Reset token expired");
            throw new AuthException("Reset link expired");
        }

        // Find the user by the email stored with the reset token.
        User user = userRepository.findByEmail(resetToken.getEmail())
                .orElseThrow(() -> new AuthException("Invalid reset link"));

        // Encrypt the new password using the configured BCrypt password encoder.
        user.setPassword(passwordEncoder.encode(newPassword));

        // Save the updated encrypted password to the users table.
        userRepository.save(user);

        // Mark the token as used before removing it after successful password reset.
        resetToken.setUsed(true);
        passwordResetTokenRepository.save(resetToken);

        // Delete all reset tokens for this email after success so no link can be reused.
        passwordResetTokenRepository.deleteByEmail(resetToken.getEmail());
        log.info("Password reset successful. Reset tokens invalidated for email={}", resetToken.getEmail());

        // Return a clear success message for the API response.
        return "Password reset successfully";
    }

    private String generateSecureToken() {
        byte[] bytes = new byte[32];
        new SecureRandom().nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String hashToken(String token) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256")
                    .digest(token.getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder(digest.length * 2);
            for (byte b : digest) {
                hex.append(String.format("%02x", b));
            }
            return hex.toString();
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to secure reset token", ex);
        }
    }

    private void validatePasswordStrength(String password) {
        if (password == null
                || password.length() < 8
                || !password.matches(".*[A-Z].*")
                || !password.matches(".*[a-z].*")
                || !password.matches(".*[0-9].*")
                || !password.matches(".*[^A-Za-z0-9].*")) {
            throw new AuthException("Password must be at least 8 characters and include uppercase, lowercase, number, and special character");
        }
    }
}
