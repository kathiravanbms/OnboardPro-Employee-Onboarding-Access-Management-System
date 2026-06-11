package com.onboardpro.employee.serviceimpl;

import com.onboardpro.employee.dto.ManagerTeamOnboardingResponse;
import com.onboardpro.employee.entity.AccessRequest;
import com.onboardpro.employee.entity.AccessRequestStatus;
import com.onboardpro.employee.entity.Employee;
import com.onboardpro.employee.entity.OnboardingStatus;
import com.onboardpro.employee.repository.AccessRequestRepository;
import com.onboardpro.employee.repository.EmployeeRepository;
import com.onboardpro.employee.service.ManagerTeamOnboardingService;
import java.time.Instant;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ManagerTeamOnboardingServiceImpl implements ManagerTeamOnboardingService {

    private final EmployeeRepository employeeRepository;
    private final AccessRequestRepository accessRequestRepository;

    @Override
    @Transactional(readOnly = true)
    public List<ManagerTeamOnboardingResponse> listTeamOnboarding(String managerEmail) {
        Optional<Employee> manager = employeeRepository.findByEmailIgnoreCase(clean(managerEmail));
        List<Employee> teamMembers = findTeamMembers(managerEmail, manager);
        Map<Long, AccessRequest> latestAccessRequests = latestAccessRequests(teamMembers);

        return teamMembers.stream()
                .map(employee -> toResponse(employee, latestAccessRequests.get(employee.getId())))
                .toList();
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

    private Map<Long, AccessRequest> latestAccessRequests(List<Employee> teamMembers) {
        List<Long> employeeIds = teamMembers.stream().map(Employee::getId).toList();
        if (employeeIds.isEmpty()) {
            return Map.of();
        }

        return accessRequestRepository.findByEmployeeIdInOrderByUpdatedAtDesc(employeeIds).stream()
                .collect(Collectors.toMap(
                        request -> request.getEmployee().getId(),
                        Function.identity(),
                        (existing, candidate) -> latest(existing, candidate)
                ));
    }

    private AccessRequest latest(AccessRequest first, AccessRequest second) {
        return timestamp(first).isAfter(timestamp(second)) ? first : second;
    }

    private ManagerTeamOnboardingResponse toResponse(Employee employee, AccessRequest accessRequest) {
        return new ManagerTeamOnboardingResponse(
                employee.getId(),
                employee.getId(),
                employee.getEmployeeCode(),
                employee.getFullName(),
                employee.getEmail(),
                employee.getDepartment().getCode(),
                employee.getDepartment().getName(),
                employee.getJobTitle(),
                employee.getStartDate(),
                onboardingStatus(employee.getOnboardingStatus()),
                documentStatus(employee.getOnboardingStatus()),
                accessStatus(accessRequest),
                employee.getOnboardingProgress()
        );
    }

    private String onboardingStatus(OnboardingStatus status) {
        if (status == OnboardingStatus.COMPLETED) return "Completed";
        if (status == OnboardingStatus.HR_VERIFICATION) return "HR Verification";
        if (status == OnboardingStatus.PENDING_APPROVAL) return "Pending Approval";
        if (status == OnboardingStatus.IN_PROGRESS) return "In Progress";
        return "Initiated";
    }

    private String documentStatus(OnboardingStatus status) {
        return status == OnboardingStatus.COMPLETED || status == OnboardingStatus.PENDING_APPROVAL
                ? "Completed"
                : "Pending";
    }

    private String accessStatus(AccessRequest request) {
        if (request == null) {
            return "No Requests";
        }

        String systemName = request.getSystemName() == null || request.getSystemName().isBlank()
                ? ""
                : " - " + request.getSystemName();
        AccessRequestStatus status = request.getStatus();
        return switch (status) {
            case REQUESTED -> "Requested" + systemName;
            case APPROVED -> "Accepted" + systemName;
            case PROVISIONED -> "Provisioned" + systemName;
            case REJECTED -> "Rejected" + systemName;
        };
    }

    private Instant timestamp(AccessRequest request) {
        if (request.getUpdatedAt() != null) return request.getUpdatedAt();
        if (request.getProvisionedAt() != null) return request.getProvisionedAt();
        if (request.getDecidedAt() != null) return request.getDecidedAt();
        return request.getCreatedAt() == null ? Instant.EPOCH : request.getCreatedAt();
    }

    private String clean(String value) {
        return value == null ? "" : value.trim();
    }
}
