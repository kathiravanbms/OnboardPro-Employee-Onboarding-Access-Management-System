package com.onboardpro.employee.serviceimpl;

import com.onboardpro.employee.dto.AccessDeactivationRequest;
import com.onboardpro.employee.dto.AccessDeactivationCandidateRow;
import com.onboardpro.employee.dto.AccessDeactivationPageResponse;
import com.onboardpro.employee.dto.AccessDeactivationResponse;
import com.onboardpro.employee.dto.AccessDeactivationSummaryRow;
import com.onboardpro.employee.dto.DeactivateSystemsRequest;
import com.onboardpro.employee.entity.AccessDeactivation;
import com.onboardpro.employee.entity.Employee;
import com.onboardpro.employee.entity.EmployeeStatus;
import com.onboardpro.employee.entity.Notification;
import com.onboardpro.employee.exception.BusinessException;
import com.onboardpro.employee.exception.ResourceNotFoundException;
import com.onboardpro.employee.repository.AccessAssignmentRepository;
import com.onboardpro.employee.repository.AccessDeactivationRepository;
import com.onboardpro.employee.repository.EmployeeRepository;
import com.onboardpro.employee.repository.NotificationRepository;
import jakarta.servlet.http.HttpServletRequest;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

@Service
@RequiredArgsConstructor
public class AccessDeactivationServiceImpl {

    private static final String IT_ROLE = "IT Administrator";
    private static final String IT_INBOX = "it@onboardpro.local";
    private static final List<String> ACTIVE_ASSIGNMENT_STATUSES = List.of("provisioned", "active");
    private static final List<String> COMPLETED_DEACTIVATION_STATUSES = List.of("deactivated", "completed");

    private final AccessDeactivationRepository accessDeactivationRepository;
    private final AccessAssignmentRepository accessAssignmentRepository;
    private final EmployeeRepository employeeRepository;
    private final NotificationRepository notificationRepository;
    private final AuditLogServiceImpl auditLogService;
    private final AuthAccountClient authAccountClient;
    private final DeactivationStatusSynchronizer deactivationStatusSynchronizer;

    @Transactional(readOnly = true)
    public List<AccessDeactivationResponse> listDeactivations(String status) {
        List<AccessDeactivation> deactivations = status == null || status.isBlank()
                ? accessDeactivationRepository.findAll()
                : accessDeactivationRepository.findByStatusIgnoreCase(status.trim());
        return deactivations.stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<AccessDeactivationPageResponse> listActiveDeactivationCandidates() {
        List<AccessDeactivationCandidateRow> rows = accessAssignmentRepository.findDeactivationCandidateRows(
                EmployeeStatus.ACTIVE,
                ACTIVE_ASSIGNMENT_STATUSES,
                COMPLETED_DEACTIVATION_STATUSES
        );
        Map<Long, AccessDeactivationCandidateRow> employeesById = new LinkedHashMap<>();
        Map<Long, Set<String>> systemsByEmployeeId = new LinkedHashMap<>();

        for (AccessDeactivationCandidateRow row : rows) {
            if (row.id() == null || !hasText(row.systemName())) {
                continue;
            }
            employeesById.putIfAbsent(row.id(), row);
            systemsByEmployeeId.computeIfAbsent(row.id(), ignored -> new LinkedHashSet<>()).add(row.systemName().trim());
        }

        List<AccessDeactivationPageResponse> candidates = new ArrayList<>();
        for (Map.Entry<Long, AccessDeactivationCandidateRow> entry : employeesById.entrySet()) {
            List<String> systems = new ArrayList<>(systemsByEmployeeId.getOrDefault(entry.getKey(), Set.of()));
            if (systems.isEmpty()) {
                continue;
            }
            AccessDeactivationCandidateRow row = entry.getValue();
            candidates.add(new AccessDeactivationPageResponse(
                    row.id(),
                    row.employeeCode(),
                    row.fullName(),
                    row.departmentName(),
                    systems,
                    "Active",
                    null,
                    null,
                    null
            ));
        }
        return candidates;
    }

    @Transactional(readOnly = true)
    public List<AccessDeactivationPageResponse> listDeactivatedEmployees() {
        return accessDeactivationRepository.findLatestDeactivatedRows("Deactivated").stream()
                .map(this::toPageResponse)
                .toList();
    }

    @Transactional
    public AccessDeactivationResponse createDeactivation(AccessDeactivationRequest request) {
        Employee employee = resolveEmployee(request);
        if (employee.getStatus() != EmployeeStatus.ACTIVE) {
            throw new BusinessException("Employee is already deactivated.");
        }
        accessDeactivationRepository
                .findOpenForEmployee(employee.getId(), List.of("pending", "approved", "deactivated"))
                .ifPresent(existing -> {
                    if ("Deactivated".equalsIgnoreCase(existing.getStatus())) {
                        throw new BusinessException("Employee is already deactivated.");
                    }
                    throw new BusinessException("A deactivation request already exists for this employee");
                });

        employee.setStatus(EmployeeStatus.INACTIVE);
        Instant deactivatedAt = Instant.now();
        AccessDeactivation deactivation = AccessDeactivation.builder()
                .employee(employee)
                .employeeCode(employee.getEmployeeCode())
                .employeeName(employee.getFullName())
                .employeeEmail(employee.getEmail())
                .department(employee.getDepartment().getName())
                .exitDate(request.exitDate())
                .reason(request.reason().trim())
                .systems(joinSystems(request.systems()))
                .notes(request.notes().trim())
                .requestedBy(firstText(request.requestedBy(), "IT Administrator"))
                .status("Deactivated")
                .deactivatedAt(deactivatedAt)
                .build();
        AccessDeactivation saved = accessDeactivationRepository.save(deactivation);
        deactivationStatusSynchronizer.markLatestDeactivated(employee);
        deactivateAuthAccount(employee);
        auditLogService.record(
                saved.getRequestedBy(),
                "IT Manager",
                "Deactivations",
                "User access revoked",
                "Deactivation request created for %s.".formatted(saved.getEmployeeName()),
                saved.getEmployee() == null ? null : saved.getEmployee().getId(),
                saved.getEmployeeName()
        );
        notifyRole(
                saved,
                "Deactivation request created",
                "A deactivation request was created for %s.".formatted(saved.getEmployeeName())
        );
        return toResponse(saved);
    }

    @Transactional
    public AccessDeactivationResponse deactivateSystems(Long id, DeactivateSystemsRequest request) {
        AccessDeactivation deactivation = accessDeactivationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Access deactivation not found"));
        String previousStatus = deactivation.getStatus();
        if (request.systems() != null && !request.systems().isEmpty()) {
            deactivation.setSystems(joinSystems(request.systems()));
        }
        markEmployeeInactive(deactivation);
        deactivation.setStatus("Deactivated");
        if (deactivation.getDeactivatedAt() == null) {
            deactivation.setDeactivatedAt(Instant.now());
        }
        AccessDeactivation saved = accessDeactivationRepository.save(deactivation);
        if (!"Deactivated".equalsIgnoreCase(previousStatus)) {
            auditLogService.record(
                    "IT Manager",
                    "IT Manager",
                    "Deactivations",
                    "Employee deactivated",
                    "Access deactivated for %s across %s.".formatted(saved.getEmployeeName(), saved.getSystems()),
                    saved.getEmployee() == null ? null : saved.getEmployee().getId(),
                    saved.getEmployeeName()
            );
            notifyEmployeeAccessDeactivated(saved);
        }
        return toResponse(saved);
    }

    @Transactional
    public AccessDeactivationResponse completeDeactivation(Long id) {
        AccessDeactivation deactivation = accessDeactivationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Access deactivation not found"));
        String previousStatus = deactivation.getStatus();
        markEmployeeInactive(deactivation);
        deactivation.setStatus("Deactivated");
        if (deactivation.getDeactivatedAt() == null) {
            deactivation.setDeactivatedAt(Instant.now());
        }
        AccessDeactivation saved = accessDeactivationRepository.save(deactivation);
        if (!"Deactivated".equalsIgnoreCase(previousStatus)) {
            auditLogService.record(
                    "IT Manager",
                    "IT Manager",
                    "Deactivations",
                    "Employee deactivated",
                    "Deactivation completed for %s.".formatted(saved.getEmployeeName()),
                    saved.getEmployee() == null ? null : saved.getEmployee().getId(),
                    saved.getEmployeeName()
            );
            notifyEmployeeAccessDeactivated(saved);
        }
        return toResponse(saved);
    }

    private AccessDeactivationResponse toResponse(AccessDeactivation deactivation) {
        String employeeCode = firstText(deactivation.getEmployeeCode(), deactivation.getEmployee() == null ? null : deactivation.getEmployee().getEmployeeCode());
        String employeeName = firstText(deactivation.getEmployeeName(), deactivation.getEmployee() == null ? null : deactivation.getEmployee().getFullName());
        return new AccessDeactivationResponse(
                deactivation.getId(),
                deactivation.getEmployee() == null ? null : deactivation.getEmployee().getId(),
                employeeCode,
                employeeCode,
                employeeName,
                employeeName,
                deactivation.getEmployeeEmail(),
                deactivation.getDepartment(),
                deactivation.getExitDate(),
                deactivation.getReason(),
                splitSystems(deactivation.getSystems()),
                deactivation.getNotes(),
                deactivation.getRequestedBy(),
                deactivation.getStatus(),
                deactivation.getDeactivatedAt(),
                deactivation.getCreatedAt(),
                deactivation.getUpdatedAt()
        );
    }

    private AccessDeactivationPageResponse toPageResponse(AccessDeactivationSummaryRow row) {
        return new AccessDeactivationPageResponse(
                row.id(),
                row.employeeCode(),
                row.fullName(),
                row.departmentName(),
                splitSystems(row.systems()),
                firstText(row.status(), "Deactivated"),
                row.deactivatedOn(),
                row.exitDate(),
                row.reason()
        );
    }

    private Employee resolveEmployee(AccessDeactivationRequest request) {
        if (request.employeeId() != null) {
            return employeeRepository.findById(request.employeeId())
                    .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));
        }
        if (hasText(request.employeeCode())) {
            return employeeRepository.findByEmployeeCodeIgnoreCase(request.employeeCode())
                    .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));
        }
        if (hasText(request.email())) {
            return employeeRepository.findByEmailIgnoreCase(request.email())
                    .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));
        }
        throw new BusinessException("Select an employee before creating a deactivation request");
    }

    private void markEmployeeInactive(AccessDeactivation deactivation) {
        Employee employee = deactivation.getEmployee();
        if (employee == null) {
            throw new BusinessException("Deactivation is not linked to an employee account");
        }
        employee.setStatus(EmployeeStatus.INACTIVE);
        deactivation.setEmployeeCode(employee.getEmployeeCode());
        deactivation.setEmployeeName(employee.getFullName());
        deactivation.setEmployeeEmail(employee.getEmail());
        deactivation.setDepartment(employee.getDepartment().getName());
        deactivationStatusSynchronizer.markLatestDeactivated(employee);
        deactivateAuthAccount(employee);
    }

    private void deactivateAuthAccount(Employee employee) {
        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        HttpServletRequest request = attributes == null ? null : attributes.getRequest();
        String authorization = request == null ? null : request.getHeader(HttpHeaders.AUTHORIZATION);
        try {
            authAccountClient.deactivateByEmail(employee.getEmail(), authorization);
        } catch (RuntimeException ex) {
            throw new BusinessException("Employee was marked inactive, but auth sessions could not be revoked. Please try again.");
        }
    }

    private String joinSystems(List<String> systems) {
        return systems.stream()
                .filter(this::hasText)
                .map(String::trim)
                .distinct()
                .reduce((left, right) -> left + "," + right)
                .orElse("");
    }

    private List<String> splitSystems(String systems) {
        if (!hasText(systems)) {
            return List.of();
        }
        return Arrays.stream(systems.split(","))
                .map(String::trim)
                .filter(this::hasText)
                .toList();
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

    private void notifyRole(AccessDeactivation deactivation, String title, String message) {
        Notification notification = Notification.builder()
                .employee(deactivation.getEmployee())
                .recipientEmail(IT_INBOX)
                .recipientRole(IT_ROLE)
                .title(title)
                .message(message)
                .readFlag(false)
                .build();
        notificationRepository.save(notification);
    }

    private void notifyEmployeeAccessDeactivated(AccessDeactivation deactivation) {
        String email = deactivation.getEmployeeEmail();
        if (!hasText(email)) {
            return;
        }

        Notification notification = Notification.builder()
                .employee(deactivation.getEmployee())
                .recipientUserId(deactivation.getEmployee() == null ? null : deactivation.getEmployee().getId())
                .recipientEmail(email.trim().toLowerCase())
                .recipientRole("Employee")
                .title("Access deactivated")
                .message("Your access has been deactivated for: %s.".formatted(deactivation.getSystems()))
                .readFlag(false)
                .build();
        notificationRepository.save(notification);
    }
}
