package com.onboardpro.employee.serviceimpl;

import com.onboardpro.employee.dto.ItProfileResponse;
import com.onboardpro.employee.dto.ItProfileUpdateRequest;
import com.onboardpro.employee.entity.Employee;
import com.onboardpro.employee.exception.BusinessException;
import com.onboardpro.employee.exception.ResourceNotFoundException;
import com.onboardpro.employee.repository.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ItProfileServiceImpl {

    private static final String ROLE_LABEL = "IT Manager";

    private final EmployeeRepository employeeRepository;
    private final AuditLogServiceImpl auditLogService;

    @Transactional(readOnly = true)
    public ItProfileResponse getCurrentProfile(String email) {
        return toResponse(resolveCurrentEmployee(email));
    }

    @Transactional
    public ItProfileResponse updateCurrentProfile(String email, ItProfileUpdateRequest request) {
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
                "IT Manager profile updated for %s.".formatted(saved.getFullName()),
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
                .orElseThrow(() -> new ResourceNotFoundException("IT Manager profile not found"));
    }

    private ItProfileResponse toResponse(Employee employee) {
        return new ItProfileResponse(
                employee.getId(),
                employee.getEmployeeCode(),
                employee.getFullName(),
                employee.getEmail(),
                employee.getPhoneNumber(),
                ROLE_LABEL
        );
    }

    private String clean(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}
