package com.onboardpro.authidentity.service;

import com.onboardpro.authidentity.domain.RefreshToken;
import com.onboardpro.authidentity.domain.User;
import com.onboardpro.authidentity.exception.AuthException;
import com.onboardpro.authidentity.repository.RefreshTokenRepository;
import com.onboardpro.authidentity.repository.UserRepository;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class TokenService {

    private final RefreshTokenRepository refreshTokenRepository;
    private final UserRepository userRepository;

    @Transactional
    public RefreshToken saveRefreshToken(User user, String rawToken, Instant expiryDate) {
        RefreshToken refreshToken = RefreshToken.builder()
                .token(rawToken)
                .user(user)
                .expiryDate(expiryDate)
                .isRevoked(false)
                .build();
        return refreshTokenRepository.save(refreshToken);
    }

    @Transactional
    public void revokeAllTokens(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AuthException("User not found"));
        revokeAllTokens(user);
    }

    @Transactional
    public void revokeAllTokens(User user) {
        refreshTokenRepository.findAllByUser(user).forEach(token -> token.setIsRevoked(true));
    }

    @Transactional(readOnly = true)
    public Optional<RefreshToken> findByToken(String token) {
        return refreshTokenRepository.findByToken(token);
    }
}
