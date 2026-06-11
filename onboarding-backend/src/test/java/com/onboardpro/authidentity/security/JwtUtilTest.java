package com.onboardpro.authidentity.security;

import static org.assertj.core.api.Assertions.assertThat;

import com.onboardpro.authidentity.config.JwtProperties;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.userdetails.User;

class JwtUtilTest {

    private static final String SECRET = "change-this-production-secret-key-at-least-32-bytes-long";

    @Test
    void accessTokenContainsAuthenticatedUserIdClaim() {
        JwtUtil jwtUtil = new JwtUtil(new JwtProperties(
                SECRET,
                Duration.ofMinutes(15),
                Duration.ofDays(7)
        ));
        UUID userId = UUID.fromString("8ca64a4b-e56b-4709-8001-a5f4f8473d46");
        var userDetails = User.withUsername("manager@example.com")
                .password("unused")
                .authorities("ROLE_DEPARTMENT_MANAGER")
                .build();

        String token = jwtUtil.generateAccessToken(userDetails, userId);
        var claims = Jwts.parser()
                .verifyWith(Keys.hmacShaKeyFor(SECRET.getBytes(StandardCharsets.UTF_8)))
                .build()
                .parseSignedClaims(token)
                .getPayload();

        assertThat(claims.get("user_id", String.class)).isEqualTo(userId.toString());
        assertThat(claims.getSubject()).isEqualTo("manager@example.com");
    }
}
