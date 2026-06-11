package com.onboardpro.employee.serviceimpl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.onboardpro.employee.entity.EmployeeStatus;
import com.onboardpro.employee.entity.TaskStatus;
import com.onboardpro.employee.repository.EmployeeRepository;
import com.onboardpro.employee.repository.NotificationRepository;
import com.onboardpro.employee.repository.OnboardingTaskRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.JdbcTemplate;

@ExtendWith(MockitoExtension.class)
class DashboardServiceImplTest {

    @Mock
    private JdbcTemplate jdbcTemplate;

    @Mock
    private EmployeeRepository employeeRepository;

    @Mock
    private OnboardingTaskRepository onboardingTaskRepository;

    @Mock
    private NotificationRepository notificationRepository;

    @InjectMocks
    private DashboardServiceImpl dashboardService;

    @Test
    void getAdminDashboardSummaryReturnsRepositoryCounts() {
        when(jdbcTemplate.queryForObject("select count(*) from onboardpro_auth.users", Long.class)).thenReturn(41L);
        when(employeeRepository.countByStatus(EmployeeStatus.ACTIVE)).thenReturn(7L);
        when(onboardingTaskRepository.countByStatus(TaskStatus.PENDING)).thenReturn(35L);
        when(notificationRepository.countByReadFlagFalse()).thenReturn(59L);

        var summary = dashboardService.getAdminDashboardSummary();

        assertThat(summary.totalUsers()).isEqualTo(41);
        assertThat(summary.activeEmployees()).isEqualTo(7);
        assertThat(summary.pendingTasks()).isEqualTo(35);
        assertThat(summary.notificationCount()).isEqualTo(59);

        verify(employeeRepository).countByStatus(EmployeeStatus.ACTIVE);
        verify(onboardingTaskRepository).countByStatus(TaskStatus.PENDING);
        verify(notificationRepository).countByReadFlagFalse();
    }
}
