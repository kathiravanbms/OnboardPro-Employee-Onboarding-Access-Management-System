package com.onboardpro.authidentity.repository;

import com.onboardpro.authidentity.domain.PasswordResetToken;
import java.time.Instant;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {

    // Find a password reset token row by the hashed token value from the email link.
    Optional<PasswordResetToken> findByToken(String token);

    // Delete old password reset tokens for this email before creating a new one.
    void deleteByEmail(String email);

    // Remove expired reset tokens without deleting still-valid links.
    void deleteByEmailAndExpiryTimeBefore(String email, Instant expiryTime);
}
