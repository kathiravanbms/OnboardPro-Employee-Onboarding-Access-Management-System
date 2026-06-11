package com.onboardpro.employee.serviceimpl;

import com.onboardpro.employee.dto.EmployeeCreateRequest;
import com.onboardpro.employee.dto.EmployeeResponse;
import com.onboardpro.employee.dto.EmployeeStatusUpdateRequest;
import com.onboardpro.employee.dto.EmployeeUpdateRequest;
import com.onboardpro.employee.entity.Department;
import com.onboardpro.employee.entity.Employee;
import com.onboardpro.employee.entity.EmployeeStatus;
import com.onboardpro.employee.entity.OnboardingStatus;
import com.onboardpro.employee.exception.BusinessException;
import com.onboardpro.employee.exception.ResourceNotFoundException;
import com.onboardpro.employee.repository.DepartmentRepository;
import com.onboardpro.employee.repository.EmployeeRepository;
import com.onboardpro.employee.service.EmployeeService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class EmployeeServiceImpl implements EmployeeService {

    private final EmployeeRepository employeeRepository;
    private final DepartmentRepository departmentRepository;
    private final AuditLogServiceImpl auditLogService;
    private final DeactivationStatusSynchronizer deactivationStatusSynchronizer;

    @Override
    @Transactional
    public EmployeeResponse createEmployee(EmployeeCreateRequest request) {
        String email = request.email().trim().toLowerCase();
        if (employeeRepository.existsByEmailIgnoreCase(email)) {
            throw new BusinessException("Employee email already exists");
        }

        Department department = resolveDepartment(request.departmentCode());
        Employee employee = Employee.builder()
                .employeeCode(nextEmployeeCode(email))
                .fullName(request.fullName().trim())
                .email(email)
                .department(department)
                .jobTitle(request.jobTitle().trim())
                .managerName(clean(request.managerName()))
                .startDate(request.startDate())
                .status(EmployeeStatus.ACTIVE)
                .onboardingStatus(OnboardingStatus.NOT_STARTED)
                .onboardingProgress(0)
                .build();
        Employee saved = employeeRepository.save(employee);
        auditLogService.record(
                "Admin",
                "Admin",
                "Employees",
                "Employee profile created",
                "Employee profile created for %s.".formatted(saved.getFullName()),
                saved.getId(),
                saved.getFullName()
        );
        return ResponseMapper.employee(saved);
    }

    @Override
    @Transactional
    public EmployeeResponse updateEmployee(Long id, EmployeeUpdateRequest request) {
        Employee employee = findEmployee(id);
        String email = request.email().trim().toLowerCase();
        if (!employee.getEmail().equalsIgnoreCase(email) && employeeRepository.existsByEmailIgnoreCase(email)) {
            throw new BusinessException("Employee email already exists");
        }

        employee.setFullName(request.fullName().trim());
        employee.setEmail(email);
        employee.setDepartment(resolveDepartment(request.departmentCode()));
        employee.setJobTitle(request.jobTitle().trim());
        employee.setManagerName(clean(request.managerName()));
        employee.setStartDate(request.startDate());
        Employee saved = employeeRepository.save(employee);
        auditLogService.record(
                "Admin",
                "Admin",
                "Employees",
                "Employee profile updated",
                "Employee profile updated for %s.".formatted(saved.getFullName()),
                saved.getId(),
                saved.getFullName()
        );
        return ResponseMapper.employee(saved);
    }

    @Override
    @Transactional
    public EmployeeResponse updateStatus(Long id, EmployeeStatusUpdateRequest request) {
        Employee employee = findEmployee(id);
        employee.setStatus(request.status());
        if (isDeactivatedStatus(request.status())) {
            deactivationStatusSynchronizer.markLatestDeactivated(employee);
        }
        Employee saved = employeeRepository.save(employee);
        auditLogService.record(
                "Admin",
                "Admin",
                "Employees",
                "Employee status updated",
                "Employee status for %s changed to %s.".formatted(saved.getFullName(), saved.getStatus()),
                saved.getId(),
                saved.getFullName()
        );
        return ResponseMapper.employee(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public EmployeeResponse getEmployee(Long id) {
        return ResponseMapper.employee(findEmployee(id));
    }

    @Override
    @Transactional(readOnly = true)
    public EmployeeResponse getEmployeeByEmail(String email) {
        return ResponseMapper.employee(employeeRepository.findByEmailIgnoreCase(email.trim())
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found")));
    }

    @Override
    @Transactional(readOnly = true)
    public List<EmployeeResponse> listEmployees(EmployeeStatus status) {
        List<Employee> employees = status == null
                ? employeeRepository.findAll()
                : employeeRepository.findByStatus(status);
        return employees.stream().map(ResponseMapper::employee).toList();
    }

    private Employee findEmployee(Long id) {
        return employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));
    }

    private Department resolveDepartment(String code) {
        return departmentRepository.findByCodeIgnoreCase(code.trim())
                .or(() -> departmentRepository.findByNameIgnoreCase(code.trim()))
                .orElseThrow(() -> new ResourceNotFoundException("Department not found"));
    }

    private String nextEmployeeCode(String email) {
        String base = email.substring(0, email.indexOf("@")).replaceAll("[^A-Za-z0-9]", "");
        if (base.isBlank()) {
            base = "EMP";
        }
        String candidate = base;
        int suffix = 1;
        do {
            if (employeeRepository.existsByEmployeeCodeIgnoreCase(candidate)) {
                candidate = base + suffix++;
            } else {
                return candidate;
            }
        } while (employeeRepository.existsByEmployeeCodeIgnoreCase(candidate));
        return candidate;
    }

    private String clean(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private boolean isDeactivatedStatus(EmployeeStatus status) {
        return status == EmployeeStatus.INACTIVE || status == EmployeeStatus.DEACTIVATED;
    }
}
