package com.onboardpro.employee.serviceimpl;

import com.onboardpro.employee.dto.AuditLogRequest;
import com.onboardpro.employee.dto.AuditLogResponse;
import com.onboardpro.employee.entity.AuditLog;
import com.onboardpro.employee.repository.AuditLogRepository;
import com.onboardpro.employee.security.AuthenticatedUserPrincipal;
import com.onboardpro.employee.service.AuditLogService;
import java.time.Instant;
import java.util.List;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuditLogServiceImpl implements AuditLogService {

    private static final List<String> IT_MODULES = List.of(
            "Access Queue",
            "System Catalog",
            "Deactivations"
    );
    private static final Set<String> ADMIN_AUTHORITIES = Set.of("ROLE_ADMIN");
    private static final Set<String> IT_AUTHORITIES = Set.of("ROLE_IT_MANAGER", "ROLE_IT_ADMIN");

    private final AuditLogRepository auditLogRepository;

    @Override
    @Transactional
    public AuditLogResponse record(AuditLogRequest request) {
        return record(
                clean(request.userName(), "System"),
                clean(request.role(), "System"),
                clean(request.module(), "General"),
                clean(request.action(), "Action recorded"),
                clean(request.description(), request.action()),
                request.targetEmployeeId(),
                cleanNullable(request.targetEmployeeName())
        );
    }

    @Override
    @Transactional
    public AuditLogResponse record(String userName, String role, String module, String action, String description, Long targetEmployeeId, String targetEmployeeName) {
        String actor = clean(userName, "System");
        String actorRole = clean(role, "System");
        String normalizedModule = clean(module, "General");
        String normalizedAction = clean(action, "Action recorded");
        String normalizedDescription = clean(description, normalizedAction);

        boolean duplicate = auditLogRepository.existsDuplicateSince(
                actor,
                actorRole,
                normalizedModule,
                normalizedAction,
                normalizedDescription,
                targetEmployeeId,
                Instant.now().minusSeconds(3)
        );
        if (duplicate) {
            return null;
        }

        AuditLog saved = auditLogRepository.save(AuditLog.builder()
                .userId(currentUserId())
                .userName(actor)
                .role(actorRole)
                .module(normalizedModule)
                .action(normalizedAction)
                .description(normalizedDescription)
                .targetEmployeeId(targetEmployeeId)
                .targetEmployeeName(cleanNullable(targetEmployeeName))
                .build());
        return toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<AuditLogResponse> listFor(Authentication authentication) {
        if (hasAnyAuthority(authentication, ADMIN_AUTHORITIES)) {
            return auditLogRepository.findAllByOrderByTimestampDesc().stream().map(this::toResponse).toList();
        }
        if (hasAnyAuthority(authentication, IT_AUTHORITIES)) {
            return auditLogRepository.findByModuleInOrderByTimestampDesc(IT_MODULES).stream()
                    .filter(log -> isItRole(log.getRole()))
                    .map(this::toResponse)
                    .toList();
        }
        return List.of();
    }

    private boolean isItRole(String role) {
        return "IT Manager".equalsIgnoreCase(role) || "IT Administrator".equalsIgnoreCase(role);
    }

    private boolean hasAnyAuthority(Authentication authentication, Set<String> authorities) {
        return authentication != null
                && authentication.getAuthorities().stream().anyMatch(authority -> authorities.contains(authority.getAuthority()));
    }

    private String currentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return null;
        }
        if (authentication.getPrincipal() instanceof AuthenticatedUserPrincipal principal) {
            return cleanNullable(principal.userId());
        }
        return null;
    }

    private AuditLogResponse toResponse(AuditLog log) {
        return new AuditLogResponse(
                log.getAuditId(),
                log.getUserId(),
                log.getUserName(),
                log.getRole(),
                log.getModule(),
                log.getAction(),
                log.getDescription(),
                log.getTargetEmployeeId(),
                log.getTargetEmployeeName(),
                log.getTimestamp()
        );
    }

    private String clean(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value.trim();
    }

    private String cleanNullable(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
