package com.onboardpro.employee.serviceimpl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import com.onboardpro.employee.dto.SystemCatalogActiveUserSummaryProjection;
import com.onboardpro.employee.entity.SystemCatalog;
import com.onboardpro.employee.repository.AccessAssignmentRepository;
import com.onboardpro.employee.repository.NotificationRepository;
import com.onboardpro.employee.repository.SystemCatalogRepository;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class SystemCatalogServiceImplTest {

    @Mock
    private SystemCatalogRepository systemCatalogRepository;

    @Mock
    private AccessAssignmentRepository accessAssignmentRepository;

    @Mock
    private AuditLogServiceImpl auditLogService;

    @Mock
    private NotificationRepository notificationRepository;

    @InjectMocks
    private SystemCatalogServiceImpl systemCatalogService;

    @Test
    void activeUsersSummaryReturnsEmptyListWhenNoCatalogsExist() {
        when(systemCatalogRepository.findAll()).thenReturn(List.of());

        var result = systemCatalogService.listActiveUsersSummary();

        assertThat(result).isEmpty();
    }

    @Test
    void activeUsersSummaryMapsAggregateRowsAndDefaultsMissingCountsToZero() {
        when(systemCatalogRepository.findAll()).thenReturn(List.of(
                catalog(1L, "Jira"),
                catalog(2L, "GitHub"),
                catalog(3L, "Slack")
        ));
        when(accessAssignmentRepository.countActiveUsersBySystem("Provisioned")).thenReturn(List.of(
                summaryRow(1L, 2L),
                summaryRow(2L, null)
        ));

        var result = systemCatalogService.listActiveUsersSummary();

        assertThat(result)
                .extracting("systemCatalogId", "activeUsers")
                .containsExactly(
                        org.assertj.core.groups.Tuple.tuple(1L, 2L),
                        org.assertj.core.groups.Tuple.tuple(2L, 0L),
                        org.assertj.core.groups.Tuple.tuple(3L, 0L)
                );
    }

    @Test
    void activeUsersSummaryFallsBackToPerSystemCountsWhenAggregateQueryFails() {
        when(systemCatalogRepository.findAll()).thenReturn(List.of(
                catalog(1L, "Jira"),
                catalog(2L, "GitHub")
        ));
        when(accessAssignmentRepository.countActiveUsersBySystem("Provisioned"))
                .thenThrow(new IllegalStateException("bad query"));
        when(accessAssignmentRepository.countActiveUsersForSystem(1L, "Jira", "Provisioned")).thenReturn(2L);
        when(accessAssignmentRepository.countActiveUsersForSystem(2L, "GitHub", "Provisioned")).thenReturn(0L);

        var result = systemCatalogService.listActiveUsersSummary();

        assertThat(result)
                .extracting("systemCatalogId", "activeUsers")
                .containsExactly(
                        org.assertj.core.groups.Tuple.tuple(1L, 2L),
                        org.assertj.core.groups.Tuple.tuple(2L, 0L)
                );
    }

    private SystemCatalog catalog(Long id, String name) {
        return SystemCatalog.builder()
                .id(id)
                .name(name)
                .category("Engineering")
                .description("System")
                .accessLevels("Standard")
                .owner("IT")
                .status("ACTIVE")
                .build();
    }

    private SystemCatalogActiveUserSummaryProjection summaryRow(Long systemCatalogId, Long activeUsers) {
        return new SystemCatalogActiveUserSummaryProjection() {
            @Override
            public Long getSystemCatalogId() {
                return systemCatalogId;
            }

            @Override
            public Long getActiveUsers() {
                return activeUsers;
            }
        };
    }
}
