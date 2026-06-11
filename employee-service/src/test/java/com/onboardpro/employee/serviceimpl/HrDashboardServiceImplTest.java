package com.onboardpro.employee.serviceimpl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.onboardpro.employee.entity.DocumentStatus;
import com.onboardpro.employee.entity.OnboardingStatus;
import com.onboardpro.employee.repository.DocumentRepository;
import com.onboardpro.employee.repository.EmployeeRepository;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class HrDashboardServiceImplTest {

    @Mock
    private EmployeeRepository employeeRepository;

    @Mock
    private DocumentRepository documentRepository;

    @InjectMocks
    private HrDashboardServiceImpl hrDashboardService;

    @Test
    void getDashboardSummaryReturnsRepositoryCounts() {
        List<OnboardingStatus> activeStatuses = List.of(
                OnboardingStatus.NOT_STARTED,
                OnboardingStatus.INITIATED,
                OnboardingStatus.IN_PROGRESS,
                OnboardingStatus.PENDING_APPROVAL,
                OnboardingStatus.HR_VERIFICATION
        );

        when(employeeRepository.count()).thenReturn(8L);
        when(employeeRepository.countByOnboardingStatusIn(activeStatuses)).thenReturn(3L);
        when(documentRepository.countDistinctEmployeesByStatus(DocumentStatus.UPLOADED)).thenReturn(2L);
        when(employeeRepository.countByOnboardingStatus(OnboardingStatus.NOT_STARTED)).thenReturn(1L);
        when(employeeRepository.countByOnboardingStatus(OnboardingStatus.INITIATED)).thenReturn(1L);
        when(employeeRepository.countByOnboardingStatus(OnboardingStatus.IN_PROGRESS)).thenReturn(0L);
        when(employeeRepository.countByOnboardingStatus(OnboardingStatus.PENDING_APPROVAL)).thenReturn(1L);
        when(employeeRepository.countByOnboardingStatus(OnboardingStatus.COMPLETED)).thenReturn(5L);

        var summary = hrDashboardService.getDashboardSummary();

        assertThat(summary.totalEmployees()).isEqualTo(8);
        assertThat(summary.activeOnboardings()).isEqualTo(3);
        assertThat(summary.docsPendingVerification()).isEqualTo(2);
        assertThat(summary.completedThisMonth()).isEqualTo(5);
        assertThat(summary.lifecycle().initiated()).isEqualTo(2);
        assertThat(summary.lifecycle().inProgress()).isZero();
        assertThat(summary.lifecycle().pendingApproval()).isEqualTo(1);
        assertThat(summary.lifecycle().completed()).isEqualTo(5);

        verify(employeeRepository).count();
        verify(employeeRepository).countByOnboardingStatusIn(activeStatuses);
        verify(documentRepository).countDistinctEmployeesByStatus(DocumentStatus.UPLOADED);
    }
}
