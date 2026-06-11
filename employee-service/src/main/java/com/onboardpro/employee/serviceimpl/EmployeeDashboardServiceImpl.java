package com.onboardpro.employee.serviceimpl;

import com.onboardpro.employee.dto.EmployeeDashboardSummaryDTO;
import com.onboardpro.employee.entity.DocumentStatus;
import com.onboardpro.employee.entity.Employee;
import com.onboardpro.employee.entity.TaskStatus;
import com.onboardpro.employee.repository.AccessRequestRepository;
import com.onboardpro.employee.repository.DocumentRepository;
import com.onboardpro.employee.repository.EmployeeRepository;
import com.onboardpro.employee.repository.NotificationRepository;
import com.onboardpro.employee.repository.OnboardingTaskRepository;
import com.onboardpro.employee.repository.TrainingCompletionRepository;
import com.onboardpro.employee.repository.TrainingModuleRepository;
import com.onboardpro.employee.service.EmployeeDashboardService;
import java.util.function.Supplier;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmployeeDashboardServiceImpl implements EmployeeDashboardService {

    private final EmployeeRepository employeeRepository;
    private final OnboardingTaskRepository onboardingTaskRepository;
    private final AccessRequestRepository accessRequestRepository;
    private final DocumentRepository documentRepository;
    private final TrainingModuleRepository trainingModuleRepository;
    private final TrainingCompletionRepository trainingCompletionRepository;
    private final NotificationRepository notificationRepository;

    @Override
    @Transactional(readOnly = true)
    public EmployeeDashboardSummaryDTO getDashboardSummary(String employeeEmail) {
        if (employeeEmail == null || employeeEmail.isBlank()) {
            log.warn("Employee dashboard summary requested without an authenticated employee email");
            return emptySummary();
        }

        try {
            return employeeRepository.findByEmailIgnoreCase(employeeEmail)
                    .map(this::buildSummary)
                    .orElseGet(() -> {
                        log.warn("Employee dashboard summary requested but no employee record exists for email={}", employeeEmail);
                        return emptySummary();
                    });
        } catch (RuntimeException ex) {
            log.error("Failed to load employee dashboard summary for email={}", employeeEmail, ex);
            return emptySummary();
        }
    }

    private EmployeeDashboardSummaryDTO buildSummary(Employee employee) {
        Long employeeId = employee.getId();
        String employeeEmail = safeString(employee.getEmail());
        log.info("Building employee dashboard summary employeeId={} email={}", employeeId, employeeEmail);

        long totalTasks = safeCount("totalTasks", employeeId, () -> onboardingTaskRepository.countByEmployeeId(employeeId));
        long completedTasks = safeCount("completedTasks", employeeId, () -> onboardingTaskRepository.countByEmployeeIdAndStatus(employeeId, TaskStatus.COMPLETED));
        long pendingTasks = safeCount("pendingTasks", employeeId, () -> onboardingTaskRepository.countByEmployeeIdAndStatus(employeeId, TaskStatus.PENDING))
                + safeCount("inProgressTasks", employeeId, () -> onboardingTaskRepository.countByEmployeeIdAndStatus(employeeId, TaskStatus.IN_PROGRESS))
                + safeCount("blockedTasks", employeeId, () -> onboardingTaskRepository.countByEmployeeIdAndStatus(employeeId, TaskStatus.BLOCKED));
        long documentCount = safeCount("documentCount", employeeId, () -> documentRepository.countByEmployeeId(employeeId));
        long verifiedDocuments = safeCount("verifiedDocuments", employeeId, () -> documentRepository.countByEmployeeIdAndStatus(employeeId, DocumentStatus.VERIFIED));
        long accessRequestCount = safeCount("accessRequestCount", employeeId, () -> accessRequestRepository.countByEmployeeId(employeeId));
        long notificationCount = safeCount("notificationCount", employeeId, () -> notificationRepository.countByRecipientEmailIgnoreCaseAndReadFlagFalse(employeeEmail));
        long totalTrainingModules = safeCount("totalTrainingModules", employeeId, trainingModuleRepository::count);
        long completedTrainingModules = safeCount("completedTrainingModules", employeeId, () -> trainingCompletionRepository.countByEmployeeId(employeeId));
        boolean trainingCompleted = totalTrainingModules > 0 && completedTrainingModules >= totalTrainingModules;

        return new EmployeeDashboardSummaryDTO(
                firstText(employee.getEmployeeCode(), employee.getFullName()),
                Math.max(0, employee.getOnboardingProgress()),
                completedTasks,
                totalTasks,
                pendingTasks,
                documentCount,
                verifiedDocuments,
                accessRequestCount,
                accessRequestCount,
                notificationCount,
                trainingCompleted
        );
    }

    private EmployeeDashboardSummaryDTO emptySummary() {
        return new EmployeeDashboardSummaryDTO("", 0, 0, 0, 0, 0, 0, 0, 0, 0, false);
    }

    private String safeString(String value) {
        return value == null ? "" : value;
    }

    private String firstText(String preferred, String fallback) {
        if (preferred != null && !preferred.isBlank()) {
            return preferred;
        }
        return safeString(fallback);
    }

    private long safeCount(String metricName, Long employeeId, Supplier<Long> countSupplier) {
        try {
            Long value = countSupplier.get();
            return value == null ? 0 : Math.max(0, value);
        } catch (RuntimeException ex) {
            log.error("Failed to calculate employee dashboard metric={} employeeId={}", metricName, employeeId, ex);
            return 0;
        }
    }
}
