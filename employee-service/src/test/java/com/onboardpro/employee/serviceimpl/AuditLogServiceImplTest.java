package com.onboardpro.employee.serviceimpl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.onboardpro.employee.entity.AuditLog;
import com.onboardpro.employee.repository.AuditLogRepository;
import com.onboardpro.employee.security.AuthenticatedUserPrincipal;
import java.time.Instant;
import java.util.List;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

@ExtendWith(MockitoExtension.class)
class                                                                                                                       AuditLogServiceImplTest {

    @Mock
    private AuditLogRepository auditLogRepository;

    @InjectMocks
    private AuditLogServiceImpl auditLogService;

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void itManagerOnlySeesItActorRecordsFromAllowedModules() {
        when(auditLogRepository.findByModuleInOrderByTimestampDesc(anyList())).thenReturn(List.of(
                log(1L, "IT Manager", "Access Queue"),
                log(2L, "IT Administrator", "System Catalog"),
                log(3L, "Admin", "System Catalog"),
                log(4L, "Admin", "Deactivations")
        ));

        var authentication = new UsernamePasswordAuthenticationToken(
                "it@onboardpro.test",
                null,
                List.of(new SimpleGrantedAuthority("ROLE_IT_ADMIN"))
        );

        var result = auditLogService.listFor(authentication);

        assertThat(result).extracting("auditId").containsExactly(1L, 2L);

        var modules = ArgumentCaptor.forClass(List.class);
        verify(auditLogRepository).findByModuleInOrderByTimestampDesc(modules.capture());
        assertThat(modules.getValue()).containsExactly("Access Queue", "System Catalog", "Deactivations");
    }

    @Test
    void recordsAuthenticatedUserIdFromSecurityContext() {
        var authentication = new UsernamePasswordAuthenticationToken(
                new AuthenticatedUserPrincipal("ed82d2d1-a5fd-4bb6-a2a4-c332f648cc5c", "manager@example.com"),
                null,
                List.of(new SimpleGrantedAuthority("ROLE_DEPARTMENT_MANAGER"))
        );
        SecurityContextHolder.getContext().setAuthentication(authentication);
        when(auditLogRepository.save(org.mockito.ArgumentMatchers.any(AuditLog.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        auditLogService.record(
                "manager@example.com",
                "Department Manager",
                "Approvals",
                "Approved",
                "Manager approved onboarding request.",
                4L,
                "Test Employee"
        );

        ArgumentCaptor<AuditLog> captor = ArgumentCaptor.forClass(AuditLog.class);
        verify(auditLogRepository).save(captor.capture());
        assertThat(captor.getValue().getUserId()).isEqualTo("ed82d2d1-a5fd-4bb6-a2a4-c332f648cc5c");
    }

    @Test
    void recordsAuthenticatedUserIdForEverySupportedRole() {
        when(auditLogRepository.save(org.mockito.ArgumentMatchers.any(AuditLog.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        List<String> authorities = List.of(
                "ROLE_ADMIN",
                "ROLE_HR_MANAGER",
                "ROLE_DEPARTMENT_MANAGER",
                "ROLE_IT_MANAGER",
                "ROLE_EMPLOYEE"
        );

        for (int index = 0; index < authorities.size(); index++) {
            String userId = "00000000-0000-0000-0000-00000000010" + index;
            var authentication = new UsernamePasswordAuthenticationToken(
                    new AuthenticatedUserPrincipal(userId, "user-" + index + "@example.com"),
                    null,
                    List.of(new SimpleGrantedAuthority(authorities.get(index)))
            );
            SecurityContextHolder.getContext().setAuthentication(authentication);

            auditLogService.record(
                    "user-" + index + "@example.com",
                    authorities.get(index),
                    "Test",
                    "Action " + index,
                    "Description " + index,
                    null,
                    null
            );
        }

        ArgumentCaptor<AuditLog> captor = ArgumentCaptor.forClass(AuditLog.class);
        verify(auditLogRepository, times(authorities.size())).save(captor.capture());
        assertThat(captor.getAllValues())
                .extracting(AuditLog::getUserId)
                .doesNotContainNull()
                .hasSize(authorities.size());
    }

    private AuditLog log(Long id, String role, String module) {
        return AuditLog.builder()
                .auditId(id)
                .userName(role)
                .role(role)
                .module(module)
                .action("Action")
                .description("Description")
                .timestamp(Instant.now())
                .build();
    }
}
