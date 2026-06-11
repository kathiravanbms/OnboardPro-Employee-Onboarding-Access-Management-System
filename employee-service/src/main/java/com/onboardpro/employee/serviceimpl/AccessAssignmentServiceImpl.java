package com.onboardpro.employee.serviceimpl;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.onboardpro.employee.dto.AccessAssignmentDetailsResponse;
import com.onboardpro.employee.dto.AccessAssignmentListResponse;
import com.onboardpro.employee.dto.AccessAssignmentRequest;
import com.onboardpro.employee.dto.AccessAssignmentResponse;
import com.onboardpro.employee.dto.AssignedSystemResponse;
import com.onboardpro.employee.dto.CredentialResponse;
import com.onboardpro.employee.entity.AccessAssignment;
import com.onboardpro.employee.entity.AccessRequest;
import com.onboardpro.employee.entity.AccessRequestStatus;
import com.onboardpro.employee.entity.Employee;
import com.onboardpro.employee.entity.Notification;
import com.onboardpro.employee.exception.ResourceNotFoundException;
import com.onboardpro.employee.repository.AccessAssignmentRepository;
import com.onboardpro.employee.repository.AccessRequestRepository;
import com.onboardpro.employee.repository.EmployeeRepository;
import com.onboardpro.employee.repository.NotificationRepository;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AccessAssignmentServiceImpl {

    private final AccessAssignmentRepository accessAssignmentRepository;
    private final AccessRequestRepository accessRequestRepository;
    private final EmployeeRepository employeeRepository;
    private final NotificationRepository notificationRepository;
    private final OnboardingServiceImpl onboardingService;
    private final AuditLogServiceImpl auditLogService;
    private final ObjectMapper objectMapper;

    @Transactional
    public List<AccessAssignmentListResponse> listAssignments(String status) {
        syncApprovedAccessRequests();
        return status == null || status.isBlank()
                ? accessAssignmentRepository.findAssignmentList()
                : accessAssignmentRepository.findAssignmentListByStatus(status.trim());
    }

    @Transactional(readOnly = true)
    public AccessAssignmentDetailsResponse getAssignmentDetails(Long id) {
        AccessAssignment assignment = accessAssignmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Access assignment not found"));
        return toDetailsResponse(assignment);
    }

    @Transactional(readOnly = true)
    public List<AssignedSystemResponse> listEmployeeSystems(Long employeeId) {
        return accessAssignmentRepository.findByEmployeeIdAndStatusIgnoreCase(employeeId, "Provisioned").stream()
                .map(assignment -> new AssignedSystemResponse(assignment.getSystemName(), assignment.getSystemName(), assignment.getSystemName()))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<CredentialResponse> listEmployeeCredentials(String employeeEmail) {
        if (!hasText(employeeEmail)) {
            return List.of();
        }

        return accessAssignmentRepository.findCredentialsByEmployeeEmail(employeeEmail.trim()).stream()
                .filter(assignment -> hasText(assignment.getCredentials()))
                .map(this::toCredentialResponse)
                .toList();
    }

    @Transactional
    public AccessAssignmentResponse createAssignment(AccessAssignmentRequest request) {
        AccessAssignment assignment = new AccessAssignment();
        applyRequest(assignment, request);
        if (assignment.getStatus() == null || assignment.getStatus().isBlank()) {
            assignment.setStatus("Pending");
        }
        if (assignment.getPriority() == null || assignment.getPriority().isBlank()) {
            assignment.setPriority("Medium");
        }
        AccessAssignment saved = accessAssignmentRepository.save(assignment);
        auditLogService.record(
                "IT Manager",
                "IT Manager",
                "Access Queue",
                "Access request received",
                "Access assignment created for %s on %s.".formatted(saved.getEmployeeName(), saved.getSystemName()),
                saved.getEmployee() == null ? null : saved.getEmployee().getId(),
                saved.getEmployeeName()
        );
        return toResponse(saved);
    }

    @Transactional
    public AccessAssignmentResponse updateAssignment(Long id, AccessAssignmentRequest request, String actor) {
        AccessAssignment assignment = accessAssignmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Access assignment not found"));
        String previousStatus = assignment.getStatus();
        String previousCredentials = assignment.getCredentials();

        if (hasText(request.employeeName()) || hasText(request.employee()) || request.employeeId() != null) {
            applyRequest(assignment, request);
        }
        if (hasText(request.status())) {
            assignment.setStatus(normalizeAssignmentStatus(request.status()));
            if ("Provisioned".equals(assignment.getStatus())) {
                assignment.setProvisionedOn(LocalDate.now());
                syncProvisionedAccessRequest(assignment, actor);
            }
        }
        if (hasText(request.accessLevel())) {
            assignment.setAccessLevel(request.accessLevel().trim());
        }
        if (request.notes() != null) {
            assignment.setNotes(request.notes());
        }
        if (request.credentials() != null) {
            assignment.setCredentials(request.credentials());
        }

        AccessAssignment saved = accessAssignmentRepository.save(assignment);
        recordAssignmentUpdate(saved, previousStatus, previousCredentials, actor);
        return toResponse(saved);
    }

    @Transactional
    public AccessAssignmentResponse revokeAssignment(Long id) {
        AccessAssignment assignment = accessAssignmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Access assignment not found"));
        assignment.setStatus("Revoked");
        AccessAssignment saved = accessAssignmentRepository.save(assignment);
        auditLogService.record(
                "IT Manager",
                "IT Manager",
                "Credentials",
                "Credential revoked",
                "Credentials revoked for %s on %s.".formatted(saved.getEmployeeName(), saved.getSystemName()),
                saved.getEmployee() == null ? null : saved.getEmployee().getId(),
                saved.getEmployeeName()
        );
        auditLogService.record(
                "IT Manager",
                "IT Manager",
                "Deactivations",
                "User access revoked",
                "Access revoked for %s on %s.".formatted(saved.getEmployeeName(), saved.getSystemName()),
                saved.getEmployee() == null ? null : saved.getEmployee().getId(),
                saved.getEmployeeName()
        );
        return toResponse(saved);
    }

    void syncApprovedAccessRequests() {
        List<AccessRequest> approvedRequests = accessRequestRepository.findByStatus(AccessRequestStatus.APPROVED);
        for (AccessRequest request : approvedRequests) {
            Long employeeId = request.getEmployee().getId();
            if (accessAssignmentRepository.existsByAccessRequestId(request.getId())) {
                continue;
            }
            AccessAssignment existingAssignment = accessAssignmentRepository
                    .findFirstByEmployeeIdAndSystemNameIgnoreCase(employeeId, request.getSystemName())
                    .orElse(null);
            if (existingAssignment != null) {
                existingAssignment.setAccessRequest(request);
                accessAssignmentRepository.save(existingAssignment);
                continue;
            }
            AccessAssignment assignment = AccessAssignment.builder()
                    .employee(request.getEmployee())
                    .accessRequest(request)
                    .employeeCode(request.getEmployee().getEmployeeCode())
                    .employeeName(request.getEmployee().getFullName())
                    .employeeEmail(request.getEmployee().getEmail())
                    .systemName(request.getSystemName())
                    .approvedBy(request.getApprovedBy() == null ? "Department Manager" : request.getApprovedBy())
                    .priority("Medium")
                    .status("Pending")
                    .notes(request.getRemarks())
                    .build();
            AccessAssignment saved = accessAssignmentRepository.save(assignment);
            auditLogService.record(
                    "System",
                    "IT Manager",
                    "Access Queue",
                    "Access request received",
                    "Approved access request received for %s on %s.".formatted(saved.getEmployeeName(), saved.getSystemName()),
                    saved.getEmployee() == null ? null : saved.getEmployee().getId(),
                    saved.getEmployeeName()
            );
        }
    }

    private void applyRequest(AccessAssignment assignment, AccessAssignmentRequest request) {
        Employee employee = request.employeeId() == null ? null : employeeRepository.findById(request.employeeId()).orElse(null);
        assignment.setEmployee(employee);
        if (request.accessRequestId() != null) {
            assignment.setAccessRequest(accessRequestRepository.findById(request.accessRequestId()).orElse(null));
        }
        assignment.setEmployeeCode(firstText(request.employeeCode(), employee == null ? null : employee.getEmployeeCode()));
        assignment.setEmployeeName(firstText(request.employeeName(), request.employee(), employee == null ? null : employee.getFullName(), "Unknown employee"));
        assignment.setEmployeeEmail(firstText(request.employeeEmail(), request.email(), employee == null ? null : employee.getEmail(), ""));
        assignment.setSystemName(firstText(request.systemName(), request.system(), assignment.getSystemName(), "Unknown system"));
        assignment.setApprovedBy(firstText(request.approvedBy(), assignment.getApprovedBy(), "Department Manager"));
        assignment.setPriority(firstText(request.priority(), assignment.getPriority(), "Medium"));
        assignment.setStatus(normalizeAssignmentStatus(firstText(request.status(), assignment.getStatus(), "Pending")));
        assignment.setAccessLevel(firstText(request.accessLevel(), assignment.getAccessLevel(), "Standard"));
        assignment.setNotes(request.notes() == null ? assignment.getNotes() : request.notes());
        assignment.setCredentials(request.credentials() == null ? assignment.getCredentials() : request.credentials());
        if ("Provisioned".equals(assignment.getStatus()) && assignment.getProvisionedOn() == null) {
            assignment.setProvisionedOn(LocalDate.now());
        }
    }

    private AccessAssignmentResponse toResponse(AccessAssignment assignment) {
        String email = assignment.getEmployeeEmail();
        String employeeName = assignment.getEmployeeName();
        String systemName = assignment.getSystemName();
        return new AccessAssignmentResponse(
                assignment.getId(),
                assignment.getAccessRequest() == null ? null : assignment.getAccessRequest().getId(),
                assignment.getEmployee() == null ? null : assignment.getEmployee().getId(),
                assignment.getEmployeeCode(),
                employeeName,
                employeeName,
                email,
                email,
                systemName,
                systemName,
                assignment.getApprovedBy(),
                assignment.getPriority(),
                assignment.getStatus(),
                assignment.getAccessLevel(),
                assignment.getNotes(),
                null,
                assignment.getProvisionedOn(),
                assignment.getCreatedAt(),
                assignment.getUpdatedAt()
        );
    }

    private AccessAssignmentDetailsResponse toDetailsResponse(AccessAssignment assignment) {
        Map<String, String> parsedCredentials = parseCredentials(assignment.getCredentials());
        String username = firstText(parsedCredentials.get("username"), assignment.getEmployeeEmail());
        String temporaryPassword = firstText(
                parsedCredentials.get("temporaryPassword"),
                parsedCredentials.get("password")
        );
        return new AccessAssignmentDetailsResponse(
                assignment.getId(),
                assignment.getEmployeeName(),
                assignment.getEmployeeEmail(),
                assignment.getSystemName(),
                username,
                temporaryPassword,
                firstText(assignment.getAccessLevel(), "Standard"),
                assignment.getNotes()
        );
    }

    private CredentialResponse toCredentialResponse(AccessAssignment assignment) {
        Map<String, String> parsedCredentials = parseCredentials(assignment.getCredentials());
        String username = firstText(parsedCredentials.get("username"), assignment.getEmployeeEmail());
        String password = firstText(
                parsedCredentials.get("temporaryPassword"),
                parsedCredentials.get("password"),
                assignment.getCredentials()
        );
        Long systemCatalogId = assignment.getAccessRequest() == null || assignment.getAccessRequest().getSystemCatalog() == null
                ? null
                : assignment.getAccessRequest().getSystemCatalog().getId();

        return new CredentialResponse(
                systemCatalogId,
                assignment.getSystemName(),
                username,
                password,
                assignment.getProvisionedOn(),
                credentialStatus(assignment.getStatus())
        );
    }

    private Map<String, String> parseCredentials(String credentials) {
        if (!hasText(credentials)) {
            return Map.of();
        }
        try {
            return objectMapper.readValue(credentials, new TypeReference<>() {});
        } catch (Exception ex) {
            return Map.of("password", credentials);
        }
    }

    private String credentialStatus(String status) {
        return "Provisioned".equalsIgnoreCase(status) || "Active".equalsIgnoreCase(status) ? "ACTIVE" : "INACTIVE";
    }

    private String normalizeAssignmentStatus(String status) {
        if (!hasText(status)) {
            return "Pending";
        }
        String value = status.trim();
        if ("PROVISIONED".equalsIgnoreCase(value)) {
            return "Provisioned";
        }
        if ("PENDING".equalsIgnoreCase(value)) {
            return "Pending";
        }
        return value;
    }

    private String firstText(String... values) {
        for (String value : values) {
            if (hasText(value)) {
                return value.trim();
            }
        }
        return "";
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private void syncProvisionedAccessRequest(AccessAssignment assignment, String actor) {
        AccessRequest accessRequest = assignment.getAccessRequest();
        if (accessRequest == null && assignment.getEmployee() != null && hasText(assignment.getSystemName())) {
            accessRequest = accessRequestRepository
                    .findFirstByEmployeeIdAndSystemNameIgnoreCaseAndStatusOrderByCreatedAtDesc(
                            assignment.getEmployee().getId(),
                            assignment.getSystemName(),
                            AccessRequestStatus.APPROVED
                    )
                    .orElse(null);
        }
        if (accessRequest == null) {
            return;
        }

        if (accessRequest.getStatus() == AccessRequestStatus.PROVISIONED) {
            assignment.setAccessRequest(accessRequest);
            return;
        }

        accessRequest.setStatus(AccessRequestStatus.PROVISIONED);
        accessRequest.setProvisionedBy(actor);
        accessRequest.setProvisionedAt(Instant.now());
        accessRequestRepository.save(accessRequest);
        assignment.setAccessRequest(accessRequest);
        onboardingService.refreshPersistedProgress(accessRequest.getEmployee());
        notifyEmployee(accessRequest);
    }

    private void recordAssignmentUpdate(AccessAssignment assignment, String previousStatus, String previousCredentials, String actor) {
        String currentStatus = assignment.getStatus();
        boolean statusChanged = previousStatus == null || !previousStatus.equalsIgnoreCase(currentStatus == null ? "" : currentStatus);
        if (statusChanged && "Provisioned".equalsIgnoreCase(currentStatus)) {
            auditLogService.record(
                    actor,
                    "IT Manager",
                    "Access Queue",
                    "Access provisioned",
                    "%s provisioned %s access for %s.".formatted(actor, assignment.getSystemName(), assignment.getEmployeeName()),
                    assignment.getEmployee() == null ? null : assignment.getEmployee().getId(),
                    assignment.getEmployeeName()
            );
        } else if (statusChanged && "Failed".equalsIgnoreCase(currentStatus)) {
            auditLogService.record(
                    actor,
                    "IT Manager",
                    "Access Queue",
                    "Provisioning failed",
                    "Provisioning failed for %s on %s.".formatted(assignment.getEmployeeName(), assignment.getSystemName()),
                    assignment.getEmployee() == null ? null : assignment.getEmployee().getId(),
                    assignment.getEmployeeName()
            );
        } else if (statusChanged) {
            auditLogService.record(
                    actor,
                    "IT Manager",
                    "Access Queue",
                    "Provisioning updated",
                    "Provisioning status for %s on %s changed to %s.".formatted(assignment.getEmployeeName(), assignment.getSystemName(), currentStatus),
                    assignment.getEmployee() == null ? null : assignment.getEmployee().getId(),
                    assignment.getEmployeeName()
            );
        }

        boolean hadCredentials = hasText(previousCredentials);
        boolean hasCredentials = hasText(assignment.getCredentials());
        if (!hadCredentials && hasCredentials) {
            auditLogService.record(
                    actor,
                    "IT Manager",
                    "Credentials",
                    "Credential created",
                    "Credentials created for %s on %s.".formatted(assignment.getEmployeeName(), assignment.getSystemName()),
                    assignment.getEmployee() == null ? null : assignment.getEmployee().getId(),
                    assignment.getEmployeeName()
            );
        } else if (hadCredentials && hasCredentials && !previousCredentials.equals(assignment.getCredentials())) {
            auditLogService.record(
                    actor,
                    "IT Manager",
                    "Credentials",
                    "Credential updated",
                    "Credentials updated for %s on %s.".formatted(assignment.getEmployeeName(), assignment.getSystemName()),
                    assignment.getEmployee() == null ? null : assignment.getEmployee().getId(),
                    assignment.getEmployeeName()
            );
        }
    }

    private void notifyEmployee(AccessRequest accessRequest) {
        Employee employee = accessRequest.getEmployee();
        String notificationType = "ACCESS_PROVISIONED";
        if (notificationRepository.existsByRequestIdAndRecipientUserIdAndRecipientRoleAndNotificationType(
                accessRequest.getId(),
                employee.getId(),
                "Employee",
                notificationType
        )) {
            return;
        }
        Notification notification = Notification.builder()
                .employee(employee)
                .recipientUserId(employee.getId())
                .requestId(accessRequest.getId())
                .recipientEmail(employee.getEmail().trim().toLowerCase())
                .recipientRole("Employee")
                .notificationType(notificationType)
                .title("Access provisioned")
                .message("Your access to %s has been provisioned.".formatted(accessRequest.getSystemName()))
                .readFlag(false)
                .build();
        notificationRepository.save(notification);
    }
}
