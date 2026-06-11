package com.onboardpro.employee.serviceimpl;

import com.onboardpro.employee.dto.DashboardSummaryDTO;
import com.onboardpro.employee.entity.EmployeeStatus;
import com.onboardpro.employee.entity.TaskStatus;
import com.onboardpro.employee.repository.EmployeeRepository;
import com.onboardpro.employee.repository.NotificationRepository;
import com.onboardpro.employee.repository.OnboardingTaskRepository;
import com.onboardpro.employee.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class DashboardServiceImpl implements DashboardService {

    private static final String TOTAL_USERS_SQL = "select count(*) from onboardpro_auth.users";

    private final JdbcTemplate jdbcTemplate;
    private final EmployeeRepository employeeRepository;
    private final OnboardingTaskRepository onboardingTaskRepository;
    private final NotificationRepository notificationRepository;

    @Override
    @Transactional(readOnly = true)
    public DashboardSummaryDTO getAdminDashboardSummary() {
        Long totalUsers = jdbcTemplate.queryForObject(TOTAL_USERS_SQL, Long.class);

        return new DashboardSummaryDTO(
                totalUsers == null ? 0 : totalUsers,
                employeeRepository.countByStatus(EmployeeStatus.ACTIVE),
                onboardingTaskRepository.countByStatus(TaskStatus.PENDING),
                notificationRepository.countByReadFlagFalse()
        );
    }
}
