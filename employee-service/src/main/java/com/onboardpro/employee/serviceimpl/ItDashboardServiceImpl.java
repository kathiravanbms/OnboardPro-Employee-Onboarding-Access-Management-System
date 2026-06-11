package com.onboardpro.employee.serviceimpl;

import com.onboardpro.employee.dto.ItDashboardResponse;
import com.onboardpro.employee.dto.ItDashboardAccessQueuePreviewRow;
import com.onboardpro.employee.entity.AuditLog;
import com.onboardpro.employee.repository.AccessAssignmentRepository;
import com.onboardpro.employee.repository.AccessDeactivationRepository;
import com.onboardpro.employee.repository.AuditLogRepository;
import com.onboardpro.employee.service.ItDashboardService;
import java.time.LocalDate;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ItDashboardServiceImpl implements ItDashboardService {

    private static final String STATUS_PENDING = "Pending";
    private static final String STATUS_PROVISIONED = "Provisioned";
    private static final List<String> ACTIVITY_MODULES = List.of(
            "Access Queue",
            "Deactivations",
            "Audit Log",
            "Approvals",
            "Credentials"
    );
    private static final int RECENT_ACTIVITY_LIMIT = 5;

    private final AccessAssignmentServiceImpl accessAssignmentService;
    private final AccessAssignmentRepository accessAssignmentRepository;
    private final AccessDeactivationRepository accessDeactivationRepository;
    private final AuditLogRepository auditLogRepository;

    @Override
    @Transactional
    public ItDashboardResponse dashboard() {
        accessAssignmentService.syncApprovedAccessRequests();

        long pendingAssignments = accessAssignmentRepository.countByStatusIgnoreCase(STATUS_PENDING);
        long provisionedToday = accessAssignmentRepository.countByStatusIgnoreCaseAndProvisionedOn(
                STATUS_PROVISIONED,
                LocalDate.now()
        );
        long deactivationsPending = accessDeactivationRepository.countByStatusIgnoreCase(STATUS_PENDING);

        return new ItDashboardResponse(
                pendingAssignments,
                provisionedToday,
                pendingAssignments,
                deactivationsPending,
                accessAssignmentRepository.findDashboardAccessQueuePreview(PageRequest.of(0, 5)).stream()
                        .map(this::preview)
                        .toList(),
                recentActivities()
        );
    }

    private ItDashboardResponse.AccessQueuePreview preview(ItDashboardAccessQueuePreviewRow assignment) {
        return new ItDashboardResponse.AccessQueuePreview(
                clean(assignment.employeeName(), "Unknown employee"),
                clean(assignment.systemName(), "Unknown system"),
                clean(assignment.status(), STATUS_PENDING),
                clean(assignment.priority(), "Medium"),
                clean(assignment.approvedBy(), "Department Manager")
        );
    }

    private List<ItDashboardResponse.RecentActivity> recentActivities() {
        return auditLogRepository.findByModuleInOrderByTimestampDesc(
                        ACTIVITY_MODULES,
                        PageRequest.of(0, RECENT_ACTIVITY_LIMIT)
                ).stream()
                .map(this::activity)
                .toList();
    }

    private ItDashboardResponse.RecentActivity activity(AuditLog log) {
        return new ItDashboardResponse.RecentActivity(
                log.getTimestamp(),
                clean(log.getAction(), "Action recorded"),
                clean(log.getModule(), "Audit Log")
        );
    }

    private String clean(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value.trim();
    }
}
