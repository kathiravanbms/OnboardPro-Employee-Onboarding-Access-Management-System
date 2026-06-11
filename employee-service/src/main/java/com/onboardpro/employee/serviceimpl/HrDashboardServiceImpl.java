package com.onboardpro.employee.serviceimpl;

import com.onboardpro.employee.dto.HrDashboardSummaryDTO;
import com.onboardpro.employee.entity.AuditLog;
import com.onboardpro.employee.entity.DocumentStatus;
import com.onboardpro.employee.entity.OnboardingStatus;
import com.onboardpro.employee.repository.AuditLogRepository;
import com.onboardpro.employee.repository.DocumentRepository;
import com.onboardpro.employee.repository.EmployeeRepository;
import com.onboardpro.employee.service.HrDashboardService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class HrDashboardServiceImpl implements HrDashboardService {

    private static final List<OnboardingStatus> ACTIVE_ONBOARDING_STATUSES = List.of(
            OnboardingStatus.NOT_STARTED,
            OnboardingStatus.INITIATED,
            OnboardingStatus.IN_PROGRESS,
            OnboardingStatus.PENDING_APPROVAL,
            OnboardingStatus.HR_VERIFICATION
    );
    private static final List<String> ACTIVITY_MODULES = List.of(
            "Employees",
            "Documents",
            "Training",
            "Reports",
            "Notifications",
            "Approvals",
            "Employee Portal",
            "Onboarding"
    );
    private static final int RECENT_ACTIVITY_LIMIT = 5;

    private final EmployeeRepository employeeRepository;
    private final DocumentRepository documentRepository;
    private final AuditLogRepository auditLogRepository;

    @Override
    @Transactional(readOnly = true)
    public HrDashboardSummaryDTO getDashboardSummary() {
        long initiated = employeeRepository.countByOnboardingStatus(OnboardingStatus.NOT_STARTED)
                + employeeRepository.countByOnboardingStatus(OnboardingStatus.INITIATED);
        long inProgress = employeeRepository.countByOnboardingStatus(OnboardingStatus.IN_PROGRESS);
        long pendingApproval = employeeRepository.countByOnboardingStatus(OnboardingStatus.PENDING_APPROVAL);
        long completed = employeeRepository.countByOnboardingStatus(OnboardingStatus.COMPLETED);

        return new HrDashboardSummaryDTO(
                employeeRepository.count(),
                employeeRepository.countByOnboardingStatusIn(ACTIVE_ONBOARDING_STATUSES),
                documentRepository.countDistinctEmployeesByStatus(DocumentStatus.UPLOADED),
                completed,
                new HrDashboardSummaryDTO.LifecycleDTO(
                        initiated,
                        inProgress,
                        pendingApproval,
                        completed
                ),
                recentActivities()
        );
    }

    private List<HrDashboardSummaryDTO.RecentActivityDTO> recentActivities() {
        return auditLogRepository.findByModuleInOrderByTimestampDesc(
                        ACTIVITY_MODULES,
                        PageRequest.of(0, RECENT_ACTIVITY_LIMIT)
                ).stream()
                .map(this::activity)
                .toList();
    }

    private HrDashboardSummaryDTO.RecentActivityDTO activity(AuditLog log) {
        return new HrDashboardSummaryDTO.RecentActivityDTO(
                log.getAuditId(),
                clean(log.getDescription(), clean(log.getAction(), "Action recorded")),
                clean(log.getModule(), "Dashboard"),
                log.getTimestamp()
        );
    }

    private String clean(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value.trim();
    }
}
