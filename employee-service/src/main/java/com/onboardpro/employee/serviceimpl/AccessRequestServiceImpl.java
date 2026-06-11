package com.onboardpro.employee.serviceimpl;

import com.onboardpro.employee.dto.AccessRequestCreateRequest;
import com.onboardpro.employee.dto.AccessRequestDecisionRequest;
import com.onboardpro.employee.dto.AccessRequestResponse;
import com.onboardpro.employee.dto.SystemCatalogResponse;
import com.onboardpro.employee.entity.AccessAssignment;
import com.onboardpro.employee.entity.AccessRequest;
import com.onboardpro.employee.entity.AccessRequestStatus;
import com.onboardpro.employee.entity.Employee;
import com.onboardpro.employee.entity.Notification;
import com.onboardpro.employee.entity.SystemCatalog;
import com.onboardpro.employee.exception.BusinessException;
import com.onboardpro.employee.exception.ResourceNotFoundException;
import com.onboardpro.employee.repository.AccessAssignmentRepository;
import com.onboardpro.employee.repository.AccessRequestRepository;
import com.onboardpro.employee.repository.EmployeeRepository;
import com.onboardpro.employee.repository.NotificationRepository;
import com.onboardpro.employee.repository.SystemCatalogRepository;
import com.onboardpro.employee.service.AccessRequestService;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AccessRequestServiceImpl implements AccessRequestService {

    private static final String DEPARTMENT_MANAGER_ROLE = "Department Manager";
    private static final String DEPARTMENT_MANAGER_INBOX = "manager@onboardpro.local";
    private static final String IT_ROLE = "IT Administrator";
    private static final String IT_INBOX = "it@onboardpro.local";

    private final AccessRequestRepository accessRequestRepository;
    private final AccessAssignmentRepository accessAssignmentRepository;
    private final EmployeeRepository employeeRepository;
    private final SystemCatalogRepository systemCatalogRepository;
    private final NotificationRepository notificationRepository;
    private final OnboardingServiceImpl onboardingService;
    private final AuditLogServiceImpl auditLogService;

    @Override
    @Transactional
    public AccessRequestResponse requestAccess(AccessRequestCreateRequest request, String requestedBy) {
        Employee employee = findEmployee(request.employeeId(), requestedBy);
        SystemCatalog system = resolveActiveSystem(request);
        AccessRequest accessRequest = AccessRequest.builder()
                .employee(employee)
                .systemCatalog(system)
                .systemName(system == null ? request.systemName().trim() : system.getName())
                .justification(request.justification())
                .status(AccessRequestStatus.REQUESTED)
                .requestedBy(requestedBy)
                .build();
        AccessRequest saved = accessRequestRepository.save(accessRequest);
        auditLogService.record(
                requestedBy,
                "Employee",
                "Access Requests",
                "Access request submitted",
                "%s requested access to %s.".formatted(employee.getFullName(), saved.getSystemName()),
                employee.getId(),
                employee.getFullName()
        );
        notifyRole(
                saved,
                employee,
                DEPARTMENT_MANAGER_ROLE,
                DEPARTMENT_MANAGER_INBOX,
                "ACCESS_REQUEST_SUBMITTED",
                "Access Request Alert",
                "%s requested access to %s.".formatted(employee.getFullName(), saved.getSystemName())
        );
        return ResponseMapper.accessRequest(saved);
    }

    @Override
    @Transactional
    public AccessRequestResponse updateAccessRequest(Long id, AccessRequestDecisionRequest request, String actor) {
        AccessRequest accessRequest = accessRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Access request not found"));
        if (request.status() == AccessRequestStatus.REQUESTED) {
            throw new BusinessException("Access request status must move forward from REQUESTED");
        }
        AccessRequestStatus previousStatus = accessRequest.getStatus();
        accessRequest.setStatus(request.status());
        accessRequest.setRemarks(request.remarks());
        if (request.status() == AccessRequestStatus.PROVISIONED) {
            accessRequest.setProvisionedBy(actor);
            accessRequest.setProvisionedAt(Instant.now());
            onboardingService.refreshPersistedProgress(accessRequest.getEmployee());
            if (previousStatus != AccessRequestStatus.PROVISIONED) {
                auditLogService.record(
                        actor,
                        "IT Manager",
                        "Access Queue",
                        "Access provisioned",
                        "%s provisioned %s access for %s.".formatted(actor, accessRequest.getSystemName(), accessRequest.getEmployee().getFullName()),
                        accessRequest.getEmployee().getId(),
                        accessRequest.getEmployee().getFullName()
                );
                notifyEmployee(
                        accessRequest,
                        "ACCESS_PROVISIONED",
                        "Access provisioned",
                        "Your access to %s has been provisioned.".formatted(accessRequest.getSystemName())
                );
            }
        } else {
            accessRequest.setApprovedBy(actor);
            accessRequest.setDecidedAt(Instant.now());
            if (request.status() == AccessRequestStatus.APPROVED && previousStatus != AccessRequestStatus.APPROVED) {
                auditLogService.record(
                        actor,
                        "Department Manager",
                        "Approvals",
                        "Manager approved access request",
                        "%s approved %s access for %s.".formatted(actor, accessRequest.getSystemName(), accessRequest.getEmployee().getFullName()),
                        accessRequest.getEmployee().getId(),
                        accessRequest.getEmployee().getFullName()
                );
                onboardingService.refreshPersistedProgress(accessRequest.getEmployee());
                notifyEmployee(
                        accessRequest,
                        "ACCESS_REQUEST_APPROVED",
                        "Access request approved",
                        "Your access request for %s has been approved by your Department Manager.".formatted(accessRequest.getSystemName())
                );
                notifyRole(
                        accessRequest,
                        accessRequest.getEmployee(),
                        IT_ROLE,
                        IT_INBOX,
                        "ACCESS_REQUEST_APPROVED_FOR_IT",
                        "Access request approved by Manager",
                        "New provisioning request available: %s's request for %s was approved by %s.".formatted(
                                accessRequest.getEmployee().getFullName(),
                                accessRequest.getSystemName(),
                                actor
                        )
                );
            } else if (request.status() == AccessRequestStatus.REJECTED && previousStatus != AccessRequestStatus.REJECTED) {
                auditLogService.record(
                        actor,
                        "Department Manager",
                        "Approvals",
                        "Manager rejected access request",
                        "%s rejected %s access for %s.".formatted(actor, accessRequest.getSystemName(), accessRequest.getEmployee().getFullName()),
                        accessRequest.getEmployee().getId(),
                        accessRequest.getEmployee().getFullName()
                );
                notifyEmployee(
                        accessRequest,
                        "ACCESS_REQUEST_REJECTED",
                        "Access request rejected",
                        "Your access request for %s has been rejected.".formatted(accessRequest.getSystemName())
                );
            }
        }
        return toResponse(accessRequestRepository.save(accessRequest));
    }

    @Override
    @Transactional(readOnly = true)
    public List<AccessRequestResponse> listAccessRequests(String employeeId, String actorEmail) {
        if (employeeId != null && !employeeId.isBlank()) {
            return accessRequestRepository.findByEmployeeId(resolveEmployee(employeeId, actorEmail).getId())
                    .stream().map(this::toResponse).toList();
        }

        Optional<Employee> actorOpt = employeeRepository.findByEmailIgnoreCase(actorEmail);
        if (actorOpt.isEmpty()) {
            // Not an employee record (likely Admin/HR from auth-service only)
            return accessRequestRepository.findAll().stream().map(this::toResponse).toList();
        }

        Employee actor = actorOpt.get();
        // If actor is a Department Manager, filter by their department
        return accessRequestRepository.findByEmployeeDepartmentId(actor.getDepartment().getId())
                .stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<SystemCatalogResponse> listActiveRequestSystems() {
        return systemCatalogRepository.findByStatusIgnoreCase("ACTIVE").stream()
                .map(system -> new SystemCatalogResponse(
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
                ))
                .toList();
    }

    private Employee findEmployee(String id, String employeeEmail) {
        return resolveEmployee(id, employeeEmail);
    }

    private Employee resolveEmployee(String id, String employeeEmail) {
        if (id == null || id.isBlank()) {
            return employeeRepository.findByEmailIgnoreCase(employeeEmail)
                    .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));
        }

        String value = id.trim();
        if (value.chars().allMatch(Character::isDigit)) {
            return employeeRepository.findById(Long.parseLong(value))
                    .or(() -> employeeRepository.findByEmailIgnoreCase(employeeEmail))
                    .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));
        }

        return employeeRepository.findByEmployeeCodeIgnoreCase(value)
                .or(() -> employeeRepository.findByEmailIgnoreCase(employeeEmail))
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));
    }

    private SystemCatalog resolveActiveSystem(AccessRequestCreateRequest request) {
        if (request.systemCatalogId() == null) {
            return null;
        }

        SystemCatalog system = systemCatalogRepository.findById(request.systemCatalogId())
                .orElseThrow(() -> new ResourceNotFoundException("System catalog item not found"));
        if (!"ACTIVE".equalsIgnoreCase(system.getStatus())) {
            throw new BusinessException("Selected system is not active");
        }
        if (!system.getName().equalsIgnoreCase(request.systemName().trim())) {
            throw new BusinessException("Selected system does not match the catalog record");
        }
        return system;
    }

    private void notifyEmployee(AccessRequest accessRequest, String notificationType, String title, String message) {
        Employee employee = accessRequest.getEmployee();
        saveOnce(accessRequest, employee, employee.getId(), employee.getEmail().trim().toLowerCase(), "Employee", notificationType, title, message);
    }

    private void notifyRole(AccessRequest accessRequest, Employee employee, String recipientRole, String recipientEmail, String notificationType, String title, String message) {
        saveOnce(accessRequest, employee, 0L, recipientEmail, recipientRole, notificationType, title, message);
    }

    private void saveOnce(
            AccessRequest accessRequest,
            Employee employee,
            Long recipientUserId,
            String recipientEmail,
            String recipientRole,
            String notificationType,
            String title,
            String message) {
        if (notificationRepository.existsByRequestIdAndRecipientUserIdAndRecipientRoleAndNotificationType(
                accessRequest.getId(),
                recipientUserId,
                recipientRole,
                notificationType
        )) {
            return;
        }

        Notification notification = Notification.builder()
                .employee(employee)
                .recipientUserId(recipientUserId)
                .requestId(accessRequest.getId())
                .recipientEmail(recipientEmail)
                .recipientRole(recipientRole)
                .notificationType(notificationType)
                .title(title)
                .message(message)
                .readFlag(false)
                .build();
        notificationRepository.save(notification);
    }

    private AccessRequestResponse toResponse(AccessRequest accessRequest) {
        AccessAssignment assignment = accessAssignmentRepository.findByAccessRequestId(accessRequest.getId()).orElse(null);
        return new AccessRequestResponse(
                accessRequest.getId(),
                accessRequest.getEmployee().getId(),
                accessRequest.getEmployee().getEmployeeCode(),
                accessRequest.getSystemCatalog() == null ? null : accessRequest.getSystemCatalog().getId(),
                accessRequest.getSystemName(),
                accessRequest.getSystemCatalog() == null ? null : accessRequest.getSystemCatalog().getCategory(),
                accessRequest.getJustification(),
                accessRequest.getStatus(),
                accessRequest.getRequestedBy(),
                accessRequest.getApprovedBy(),
                accessRequest.getProvisionedBy(),
                accessRequest.getRemarks(),
                accessRequest.getDecidedAt(),
                accessRequest.getProvisionedAt(),
                accessRequest.getCreatedAt(),
                accessRequest.getUpdatedAt(),
                assignment == null ? null : assignment.getCredentials(),
                assignment == null ? null : assignment.getProvisionedOn()
        );
    }
}
