package com.onboardpro.employee.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.onboardpro.employee.dto.ApiResponse;
import com.onboardpro.employee.entity.EmployeeStatus;
import com.onboardpro.employee.repository.EmployeeRepository;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final EmployeeRepository employeeRepository;
    private final ObjectMapper objectMapper;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String header = request.getHeader("Authorization");
        if (header == null || !header.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = header.substring(7);
        try {
            String subject = jwtUtil.extractSubject(token);
            String userId = jwtUtil.extractUserId(token);
            if (userId == null || userId.isBlank()) {
                throw new IllegalArgumentException("JWT user_id claim is required");
            }
            var authorities = jwtUtil.extractRoles(token).stream()
                    .map(this::normalizeAuthority)
                    .map(SimpleGrantedAuthority::new)
                    .toList();
            boolean employeeRole = authorities.stream().anyMatch(authority -> "ROLE_EMPLOYEE".equals(authority.getAuthority()));
            if (employeeRole && employeeRepository.findByEmailIgnoreCase(subject)
                    .filter(employee -> employee.getStatus() != EmployeeStatus.ACTIVE)
                    .isPresent()) {
                SecurityContextHolder.clearContext();
                response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                objectMapper.writeValue(response.getWriter(), ApiResponse.failure("Your account has been deactivated. Please contact IT.", null));
                return;
            }
            var principal = new AuthenticatedUserPrincipal(userId, subject);
            var authentication = new UsernamePasswordAuthenticationToken(principal, null, authorities);
            SecurityContextHolder.getContext().setAuthentication(authentication);
        } catch (JwtException | IllegalArgumentException ex) {
            SecurityContextHolder.clearContext();
        }

        filterChain.doFilter(request, response);
    }

    private String normalizeAuthority(String role) {
        String cleaned = role.trim().toUpperCase();
        return cleaned.startsWith("ROLE_") ? cleaned : "ROLE_" + cleaned;
    }
}
