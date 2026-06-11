package com.onboardpro.employee.serviceimpl;

import com.onboardpro.employee.dto.EmployeeProfileResponse;
import com.onboardpro.employee.dto.EmployeeProfileUpdateRequest;
import com.onboardpro.employee.entity.Employee;
import com.onboardpro.employee.exception.BusinessException;
import com.onboardpro.employee.exception.ResourceNotFoundException;
import com.onboardpro.employee.repository.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class EmployeeProfileServiceImpl {

    private static final String ROLE_LABEL = "Employee";

    private final EmployeeRepository employeeRepository;
    private final AuditLogServiceImpl auditLogService;

    @Transactional(readOnly = true)
    public EmployeeProfileResponse getCurrentProfile(String email) {
        return toResponse(resolveCurrentEmployee(email));
    }

    @Transactional
    public EmployeeProfileResponse updateCurrentProfile(String email, EmployeeProfileUpdateRequest request) {
        Employee employee = resolveCurrentEmployee(email);
        String fullName = clean(request.fullName());
        String phoneNumber = clean(request.phoneNumber());

        if (!hasText(fullName)) {
            throw new BusinessException("Full name is required");
        }

        employee.setFullName(fullName);
        employee.setPhoneNumber(phoneNumber);
        Employee saved = employeeRepository.save(employee);

        auditLogService.record(
                saved.getFullName(),
                ROLE_LABEL,
                "Settings",
                "Profile updated",
                "Employee profile updated for %s.".formatted(saved.getFullName()),
                saved.getId(),
                saved.getFullName()
        );

        return toResponse(saved);
    }

    private Employee resolveCurrentEmployee(String email) {
        if (!hasText(email)) {
            throw new BusinessException("Logged-in user email is required");
        }
        return employeeRepository.findByEmailIgnoreCase(email.trim())
                .orElseThrow(() -> new ResourceNotFoundException("Employee profile not found"));
    }

    private EmployeeProfileResponse toResponse(Employee employee) {
        return new EmployeeProfileResponse(
                employee.getId(),
                employee.getEmployeeCode(),
                employee.getFullName(),
                employee.getEmail(),
                employee.getPhoneNumber(),
                ROLE_LABEL,
                toDisplayStatus(employee.getStatus() == null ? null : employee.getStatus().name())
        );
    }

    private String toDisplayStatus(String status) {
        if (!hasText(status)) {
            return "Not available";
        }
        String normalized = status.trim().replace('_', ' ').toLowerCase();
        return Character.toUpperCase(normalized.charAt(0)) + normalized.substring(1);
    }

    private String clean(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}
