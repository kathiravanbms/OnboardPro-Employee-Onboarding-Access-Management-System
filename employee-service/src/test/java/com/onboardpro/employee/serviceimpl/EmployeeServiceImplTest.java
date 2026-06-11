package com.onboardpro.employee.serviceimpl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.onboardpro.employee.dto.EmployeeCreateRequest;
import com.onboardpro.employee.entity.Department;
import com.onboardpro.employee.entity.Employee;
import com.onboardpro.employee.entity.EmployeeStatus;
import com.onboardpro.employee.entity.OnboardingStatus;
import com.onboardpro.employee.repository.DepartmentRepository;
import com.onboardpro.employee.repository.EmployeeRepository;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class EmployeeServiceImplTest {

    @Mock
    private EmployeeRepository employeeRepository;

    @Mock
    private DepartmentRepository departmentRepository;

    @Mock
    private AuditLogServiceImpl auditLogService;

    @Mock
    private DeactivationStatusSynchronizer deactivationStatusSynchronizer;

    @InjectMocks
    private EmployeeServiceImpl employeeService;

    @Test
    void createEmployeeDefaultsStatusAndOnboardingState() {
        Department department = Department.builder()
                .id(1L)
                .name("Human Resources")
                .code("HR")
                .active(true)
                .build();

        when(employeeRepository.existsByEmailIgnoreCase("new.hire@example.com")).thenReturn(false);
        when(departmentRepository.findByCodeIgnoreCase("HR")).thenReturn(Optional.of(department));
        when(employeeRepository.existsByEmployeeCodeIgnoreCase(any())).thenReturn(false);
        when(employeeRepository.save(any(Employee.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var request = new EmployeeCreateRequest(
                "New Hire",
                "New.Hire@Example.com",
                "HR",
                "Analyst",
                "HR Lead",
                LocalDate.of(2026, 6, 1)
        );

        var response = employeeService.createEmployee(request);

        assertThat(response.email()).isEqualTo("new.hire@example.com");
        assertThat(response.status()).isEqualTo(EmployeeStatus.ACTIVE);
        assertThat(response.onboardingStatus()).isEqualTo(OnboardingStatus.NOT_STARTED);
        assertThat(response.onboardingProgress()).isZero();

        ArgumentCaptor<Employee> employeeCaptor = ArgumentCaptor.forClass(Employee.class);
        verify(employeeRepository).save(employeeCaptor.capture());
        assertThat(employeeCaptor.getValue().getDepartment().getCode()).isEqualTo("HR");
    }

    @Test
    void listEmployeesFiltersByStatusWhenProvided() {
        Department department = Department.builder()
                .id(1L)
                .name("Human Resources")
                .code("HR")
                .active(true)
                .build();
        Employee activeEmployee = Employee.builder()
                .id(1L)
                .employeeCode("active1")
                .fullName("Active Employee")
                .email("active@example.com")
                .department(department)
                .jobTitle("Analyst")
                .managerName("HR Lead")
                .startDate(LocalDate.of(2026, 6, 1))
                .status(EmployeeStatus.ACTIVE)
                .onboardingStatus(OnboardingStatus.NOT_STARTED)
                .onboardingProgress(0)
                .build();

        when(employeeRepository.findByStatus(EmployeeStatus.ACTIVE)).thenReturn(List.of(activeEmployee));

        var response = employeeService.listEmployees(EmployeeStatus.ACTIVE);

        assertThat(response).hasSize(1);
        assertThat(response.get(0).status()).isEqualTo(EmployeeStatus.ACTIVE);
        verify(employeeRepository).findByStatus(EmployeeStatus.ACTIVE);
    }
}
