package com.onboardpro.authidentity.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "password_reset_tokens")
public class PasswordResetToken {

    // Database primary key for this reset-token row.
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Email address of the user who requested the password reset.
    @Column(name = "email", nullable = false, length = 160)
    private String email;

    // Secure unique token that is sent to the user's email reset link.
    @Column(name = "token", nullable = false, unique = true, length = 80)
    private String token;

    // Date and time when this reset token expires.
    @Column(name = "expiry_time", nullable = false)
    private Instant expiryTime;

    // Flag that records whether this reset token was already consumed.
    @Builder.Default
    @Column(name = "is_used", nullable = false)
    private boolean isUsed = false;
}
