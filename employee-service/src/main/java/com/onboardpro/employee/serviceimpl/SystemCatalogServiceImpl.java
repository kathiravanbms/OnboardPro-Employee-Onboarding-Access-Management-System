package com.onboardpro.employee.serviceimpl;

import com.onboardpro.employee.dto.SystemCatalogRequest;
import com.onboardpro.employee.dto.SystemCatalogActiveUserResponse;
import com.onboardpro.employee.dto.SystemCatalogActiveUserSummaryResponse;
import com.onboardpro.employee.dto.SystemCatalogResponse;
import com.onboardpro.employee.entity.AccessAssignment;
import com.onboardpro.employee.entity.Employee;
import com.onboardpro.employee.entity.Notification;
import com.onboardpro.employee.entity.SystemCatalog;
import com.onboardpro.employee.exception.BusinessException;
import com.onboardpro.employee.exception.ResourceNotFoundException;
import com.onboardpro.employee.repository.AccessAssignmentRepository;
import com.onboardpro.employee.repository.NotificationRepository;
import com.onboardpro.employee.repository.SystemCatalogRepository;
import java.time.Instant;
import java.util.Map;
import java.util.List;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class SystemCatalogServiceImpl {

    private static final String STATUS_DRAFT = "DRAFT";
    private static final String STATUS_PENDING_APPROVAL = "PENDING_APPROVAL";
    private static final String STATUS_APPROVED = "APPROVED";
    private static final String STATUS_ACTIVE = "ACTIVE";
    private static final String STATUS_REJECTED = "REJECTED";
    private static final String STATUS_ARCHIVED = "ARCHIVED";
    private static final String ADMIN_INBOX = "admin@onboardpro.local";
    private static final String ADMIN_ROLE = "Admin";
    private static final String IT_ROLE = "IT Administrator";

    private final SystemCatalogRepository systemCatalogRepository;
    private final AccessAssignmentRepository accessAssignmentRepository;
    private final AuditLogServiceImpl auditLogService;
    private final NotificationRepository notificationRepository;

    @Transactional(readOnly = true)
    public List<SystemCatalogResponse> listSystems(String query) {
        List<SystemCatalog> systems = query == null || query.isBlank()
                ? systemCatalogRepository.findAll()
                : systemCatalogRepository.findByNameContainingIgnoreCaseOrCategoryContainingIgnoreCase(query.trim(), query.trim());
        return systems.stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<SystemCatalogActiveUserResponse> listActiveUsers(Long systemId) {
        SystemCatalog system = systemCatalogRepository.findById(systemId)
                .orElseThrow(() -> new ResourceNotFoundException("System catalog item not found"));
        return accessAssignmentRepository.findActiveUsersForSystem(system.getId(), system.getName(), "Provisioned").stream()
                .map(this::toActiveUserResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<SystemCatalogActiveUserSummaryResponse> listActiveUsersSummary() {
        List<SystemCatalog> systems = systemCatalogRepository.findAll();
        if (systems.isEmpty()) {
            return List.of();
        }

        try {
            Map<Long, Long> countsByCatalogId = accessAssignmentRepository.countActiveUsersBySystem("Provisioned").stream()
                    .filter(row -> row.getSystemCatalogId() != null)
                    .collect(Collectors.toMap(
                            row -> row.getSystemCatalogId(),
                            row -> row.getActiveUsers() == null ? 0L : row.getActiveUsers(),
                            Long::sum
                    ));

            return systems.stream()
                    .map(system -> new SystemCatalogActiveUserSummaryResponse(
                            system.getId(),
                            countsByCatalogId.getOrDefault(system.getId(), 0L)
                    ))
                    .toList();
        } catch (RuntimeException ex) {
            log.error("Failed to load system catalog active-users summary with aggregate query. Falling back to per-system counts.", ex);
            return systems.stream()
                    .map(system -> new SystemCatalogActiveUserSummaryResponse(
                            system.getId(),
                            safeCountActiveUsers(system)
                    ))
                    .toList();
        }
    }

    @Transactional
    public SystemCatalogResponse createSystem(SystemCatalogRequest request, String requestedBy) {
        String name = cleanRequired(request.name(), "System name is required");
        if (systemCatalogRepository.existsByNameIgnoreCase(name)) {
            throw new BusinessException("System catalog name already exists");
        }

        SystemCatalog system = SystemCatalog.builder()
                .name(name)
                .category(cleanRequired(request.category(), "Category is required"))
                .description(cleanRequired(request.description(), "Description is required"))
                .accessLevels(cleanRequired(request.accessLevels(), "Access levels are required"))
                .owner(cleanRequired(request.owner(), "Owner is required"))
                .status(STATUS_PENDING_APPROVAL)
                .createdBy(clean(requestedBy, IT_ROLE))
                .build();
        SystemCatalog saved = systemCatalogRepository.save(system);
        auditLogService.record(
                clean(requestedBy, IT_ROLE),
                IT_ROLE,
                "System Catalog",
                "Catalog Created",
                "Catalog created: %s.".formatted(saved.getName()),
                null,
                null
        );
        auditLogService.record(
                clean(requestedBy, IT_ROLE),
                IT_ROLE,
                "System Catalog",
                "Catalog Submitted",
                "Catalog submitted for Admin approval: %s.".formatted(saved.getName()),
                null,
                null
        );
        notifyRole(
                ADMIN_INBOX,
                ADMIN_ROLE,
                "SYSTEM_CATALOG_PENDING_APPROVAL",
                "New System Catalog awaiting approval.",
                "New System Catalog awaiting approval."
        );
        return toResponse(saved);
    }

    @Transactional
    public SystemCatalogResponse updateSystem(Long id, SystemCatalogRequest request) {
        SystemCatalog system = systemCatalogRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("System catalog item not found"));
        if (!STATUS_PENDING_APPROVAL.equalsIgnoreCase(system.getStatus()) && !STATUS_DRAFT.equalsIgnoreCase(system.getStatus())) {
            throw new BusinessException("Only pending catalog requests can be edited");
        }
        if (hasText(request.name())) {
            String name = request.name().trim();
            if (systemCatalogRepository.existsByNameIgnoreCaseAndIdNot(name, id)) {
                throw new BusinessException("System catalog name already exists");
            }
            system.setName(name);
        }
        if (hasText(request.category())) {
            system.setCategory(request.category().trim());
        }
        if (hasText(request.description())) {
            system.setDescription(request.description().trim());
        }
        if (hasText(request.accessLevels())) {
            system.setAccessLevels(request.accessLevels().trim());
        }
        if (hasText(request.owner())) {
            system.setOwner(request.owner().trim());
        }
        SystemCatalog saved = systemCatalogRepository.save(system);
        auditLogService.record(
                clean(system.getCreatedBy(), IT_ROLE),
                IT_ROLE,
                "System Catalog",
                "Catalog Submitted",
                "Pending catalog request updated: %s.".formatted(saved.getName()),
                null,
                null
        );
        return toResponse(saved);
    }

    @Transactional
    public SystemCatalogResponse approveSystem(Long id, String approvedBy) {
        SystemCatalog system = systemCatalogRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("System catalog item not found"));
        if (!STATUS_PENDING_APPROVAL.equalsIgnoreCase(system.getStatus())) {
            throw new BusinessException("Only pending catalog requests can be approved");
        }

        system.setStatus(STATUS_APPROVED);
        system.setApprovedBy(clean(approvedBy, ADMIN_ROLE));
        system.setApprovedAt(Instant.now());
        auditLogService.record(clean(approvedBy, ADMIN_ROLE), ADMIN_ROLE, "System Catalog", "Catalog Approved", "Catalog approved: %s.".formatted(system.getName()), null, null);

        system.setStatus(STATUS_ACTIVE);
        SystemCatalog saved = systemCatalogRepository.save(system);
        auditLogService.record(clean(approvedBy, ADMIN_ROLE), ADMIN_ROLE, "System Catalog", "Catalog Activated", "Catalog activated: %s.".formatted(saved.getName()), null, null);
        notifyCreator(saved, "SYSTEM_CATALOG_APPROVED", "Your catalog has been approved and activated.", "Your catalog has been approved and activated.");
        return toResponse(saved);
    }

    @Transactional
    public SystemCatalogResponse rejectSystem(Long id, String reason, String rejectedBy) {
        SystemCatalog system = systemCatalogRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("System catalog item not found"));
        if (!STATUS_PENDING_APPROVAL.equalsIgnoreCase(system.getStatus())) {
            throw new BusinessException("Only pending catalog requests can be rejected");
        }

        system.setStatus(STATUS_REJECTED);
        system.setApprovedBy(clean(rejectedBy, ADMIN_ROLE));
        system.setApprovedAt(Instant.now());
        system.setRejectionReason(clean(reason, "Rejected by Admin"));
        SystemCatalog saved = systemCatalogRepository.save(system);
        auditLogService.record(clean(rejectedBy, ADMIN_ROLE), ADMIN_ROLE, "System Catalog", "Catalog Rejected", "Catalog rejected: %s.".formatted(saved.getName()), null, null);
        notifyCreator(saved, "SYSTEM_CATALOG_REJECTED", "Your catalog request was rejected.", "Your catalog request was rejected.");
        return toResponse(saved);
    }

    @Transactional
    public SystemCatalogResponse withdrawSystem(Long id, String requestedBy) {
        SystemCatalog system = systemCatalogRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("System catalog item not found"));
        if (!STATUS_PENDING_APPROVAL.equalsIgnoreCase(system.getStatus()) && !STATUS_DRAFT.equalsIgnoreCase(system.getStatus())) {
            throw new BusinessException("Only pending catalog requests can be withdrawn");
        }

        system.setStatus(STATUS_ARCHIVED);
        SystemCatalog saved = systemCatalogRepository.save(system);
        auditLogService.record(clean(requestedBy, IT_ROLE), IT_ROLE, "System Catalog", "Catalog Archived", "Catalog archived: %s.".formatted(saved.getName()), null, null);
        return toResponse(saved);
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private String clean(String value, String fallback) {
        return hasText(value) ? value.trim() : fallback;
    }

    private String cleanRequired(String value, String message) {
        if (!hasText(value)) {
            throw new BusinessException(message);
        }
        return value.trim();
    }

    private void notifyRole(String recipientEmail, String recipientRole, String notificationType, String title, String message) {
        notificationRepository.save(Notification.builder()
                .recipientEmail(recipientEmail)
                .recipientRole(recipientRole)
                .notificationType(notificationType)
                .title(title)
                .message(message)
                .readFlag(false)
                .build());
    }

    private void notifyCreator(SystemCatalog system, String notificationType, String title, String message) {
        String recipient = hasText(system.getCreatedBy()) ? system.getCreatedBy().trim().toLowerCase() : "it@onboardpro.local";
        notifyRole(recipient, IT_ROLE, notificationType, title, message);
    }

    private SystemCatalogResponse toResponse(SystemCatalog system) {
        return new SystemCatalogResponse(
                system.getId(),
                system.getName(),
                system.getCategory(),
                system.getDescription(),
                system.getAccessLevels(),
                system.getOwner(),
                system.getStatus(),
                system.getCreatedBy(),
                system.getApprovedBy(),
                system.getApprovedAt(),
                system.getRejectionReason(),
                accessAssignmentRepository.countActiveUsersForSystem(system.getId(), system.getName(), "Provisioned"),
                system.getCreatedAt(),
                system.getUpdatedAt()
        );
    }

    private SystemCatalogActiveUserResponse toActiveUserResponse(AccessAssignment assignment) {
        Employee employee = assignment.getEmployee();
        String employeeCode = firstText(assignment.getEmployeeCode(), employee == null ? null : employee.getEmployeeCode());
        String employeeName = firstText(assignment.getEmployeeName(), employee == null ? null : employee.getFullName());
        String email = firstText(assignment.getEmployeeEmail(), employee == null ? null : employee.getEmail());
        String department = employee == null || employee.getDepartment() == null ? "" : employee.getDepartment().getName();
        String role = employee == null ? "" : employee.getJobTitle();
        String employeeStatus = employee == null || employee.getStatus() == null ? "" : employee.getStatus().name();

        return new SystemCatalogActiveUserResponse(
                assignment.getId(),
                employee == null ? null : employee.getId(),
                employeeCode,
                employeeName,
                email,
                department,
                role,
                assignment.getStatus(),
                employeeStatus,
                assignment.getProvisionedOn(),
                assignment.getCreatedAt(),
                assignment.getAccessLevel(),
                assignment.getApprovedBy(),
                assignment.getSystemName()
        );
    }

    private long safeCountActiveUsers(SystemCatalog system) {
        try {
            return accessAssignmentRepository.countActiveUsersForSystem(system.getId(), system.getName(), "Provisioned");
        } catch (RuntimeException ex) {
            log.error("Failed to count active users for system catalog id={} name={}", system.getId(), system.getName(), ex);
            return 0L;
        }
    }

    private String firstText(String... values) {
        for (String value : values) {
            if (hasText(value)) {
                return value.trim();
            }
        }
        return "";
    }
}
