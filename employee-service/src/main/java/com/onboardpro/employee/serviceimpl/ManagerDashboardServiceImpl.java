package com.onboardpro.employee.serviceimpl;

import com.onboardpro.employee.dto.ManagerDashboardResponse;
import com.onboardpro.employee.entity.Approval;
import com.onboardpro.employee.entity.ApprovalStatus;
import com.onboardpro.employee.entity.ApprovalType;
import com.onboardpro.employee.entity.AuditLog;
import com.onboardpro.employee.entity.Employee;
import com.onboardpro.employee.repository.ApprovalRepository;
import com.onboardpro.employee.repository.AuditLogRepository;
import com.onboardpro.employee.repository.EmployeeRepository;
import com.onboardpro.employee.service.ManagerDashboardService;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ManagerDashboardServiceImpl implements ManagerDashboardService {

    private static final List<String> ACTIVITY_MODULES = List.of("Employees", "Approvals", "Onboarding");
    private static final int RECENT_ACTIVITY_LIMIT = 8;

    private final EmployeeRepository employeeRepository;
    private final ApprovalRepository approvalRepository;
    private final AuditLogRepository auditLogRepository;

    @Override
    @Transactional(readOnly = true)
    public ManagerDashboardResponse dashboard(String managerEmail) {
        Optional<Employee> manager = employeeRepository.findByEmailIgnoreCase(clean(managerEmail));
        List<Employee> teamMembers = findTeamMembers(managerEmail, manager);
        List<Long> teamMemberIds = teamMembers.stream().map(Employee::getId).toList();

        long pendingApprovals = countApprovals(teamMemberIds, ApprovalStatus.PENDING);
        long approvedRequests = countApprovals(teamMemberIds, ApprovalStatus.APPROVED);
        long rejectedRequests = countApprovals(teamMemberIds, ApprovalStatus.REJECTED);

        return new ManagerDashboardResponse(
                teamMembers.size(),
                pendingApprovals,
                approvedRequests,
                rejectedRequests,
                recentActivities(teamMembers, teamMemberIds)
        );
    }

    private List<Employee> findTeamMembers(String managerEmail, Optional<Employee> manager) {
        Set<String> managerKeys = managerKeys(managerEmail, manager);
        List<Employee> teamMembers = managerKeys.isEmpty()
                ? List.of()
                : employeeRepository.findManagedEmployeesByManagerKeys(managerKeys);

        if (teamMembers.isEmpty() && manager.isPresent() && manager.get().getDepartment() != null) {
            Long managerId = manager.get().getId();
            teamMembers = employeeRepository.findByDepartmentId(manager.get().getDepartment().getId()).stream()
                    .filter(employee -> !employee.getId().equals(managerId))
                    .toList();
        }

        if (teamMembers.isEmpty() && manager.isEmpty()) {
            teamMembers = employeeRepository.findAll();
        }

        return teamMembers;
    }

    private Set<String> managerKeys(String managerEmail, Optional<Employee> manager) {
        Set<String> keys = new LinkedHashSet<>();
        addKey(keys, managerEmail);
        if (managerEmail != null && managerEmail.contains("@")) {
            addKey(keys, managerEmail.substring(0, managerEmail.indexOf("@")));
        }
        manager.ifPresent(employee -> {
            addKey(keys, employee.getFullName());
            addKey(keys, employee.getEmployeeCode());
            addKey(keys, employee.getEmail());
            if (employee.getEmail() != null && employee.getEmail().contains("@")) {
                addKey(keys, employee.getEmail().substring(0, employee.getEmail().indexOf("@")));
            }
        });
        return keys;
    }

    private void addKey(Set<String> keys, String value) {
        String cleaned = clean(value);
        if (!cleaned.isBlank()) {
            keys.add(cleaned.toLowerCase(Locale.ROOT));
        }
    }

    private long countApprovals(List<Long> teamMemberIds, ApprovalStatus status) {
        if (teamMemberIds.isEmpty()) {
            return 0;
        }
        return approvalRepository.countByEmployeeIdInAndApprovalTypeAndStatus(teamMemberIds, ApprovalType.MANAGER_APPROVAL, status);
    }

    private List<ManagerDashboardResponse.RecentActivity> recentActivities(List<Employee> teamMembers, List<Long> teamMemberIds) {
        if (teamMemberIds.isEmpty()) {
            return List.of();
        }

        List<ManagerDashboardResponse.RecentActivity> auditActivities = auditLogRepository
                .findByTargetEmployeeIdInAndModuleInOrderByTimestampDesc(
                        teamMemberIds,
                        ACTIVITY_MODULES,
                        PageRequest.of(0, RECENT_ACTIVITY_LIMIT)
                ).stream()
                .map(this::activity)
                .toList();

        if (!auditActivities.isEmpty()) {
            return auditActivities;
        }

        List<ManagerDashboardResponse.RecentActivity> fallbackActivities = new ArrayList<>();
        approvalRepository.findByEmployeeIdInAndApprovalTypeOrderByUpdatedAtDesc(teamMemberIds, ApprovalType.MANAGER_APPROVAL)
                .forEach(approval -> fallbackActivities.add(activity(approval)));
        teamMembers.forEach(employee -> fallbackActivities.add(activity(employee)));

        return fallbackActivities.stream()
                .sorted(Comparator.comparing(ManagerDashboardResponse.RecentActivity::timestamp).reversed())
                .limit(RECENT_ACTIVITY_LIMIT)
                .toList();
    }

    private ManagerDashboardResponse.RecentActivity activity(AuditLog log) {
        return new ManagerDashboardResponse.RecentActivity(
                log.getAuditId(),
                activityType(log.getModule(), log.getAction()),
                log.getDescription(),
                log.getTimestamp()
        );
    }

    private ManagerDashboardResponse.RecentActivity activity(Approval approval) {
        String employeeName = approval.getEmployee().getFullName();
        String message = switch (approval.getStatus()) {
            case APPROVED -> "Manager approved onboarding request for " + employeeName;
            case REJECTED -> "Manager rejected onboarding request for " + employeeName;
            case PENDING -> employeeName + " submitted onboarding request";
        };
        return new ManagerDashboardResponse.RecentActivity(
                approval.getId(),
                "APPROVAL",
                message,
                approval.getUpdatedAt()
        );
    }

    private ManagerDashboardResponse.RecentActivity activity(Employee employee) {
        return new ManagerDashboardResponse.RecentActivity(
                employee.getId(),
                "EMPLOYEE",
                "Employee profile created for " + employee.getFullName(),
                employee.getCreatedAt()
        );
    }

    private String activityType(String module, String action) {
        String source = (module + " " + action).toUpperCase(Locale.ROOT);
        if (source.contains("APPROV") || source.contains("REJECT")) {
            return "APPROVAL";
        }
        if (source.contains("ONBOARD")) {
            return "ONBOARDING";
        }
        return "EMPLOYEE";
    }

    private String clean(String value) {
        return value == null ? "" : value.trim();
    }
}
