package com.onboardpro.employee.controller;

import com.onboardpro.employee.dto.ApiResponse;
import com.onboardpro.employee.dto.EmployeeCreateRequest;
import com.onboardpro.employee.dto.EmployeeResponse;
import com.onboardpro.employee.dto.EmployeeStatusUpdateRequest;
import com.onboardpro.employee.dto.EmployeeUpdateRequest;
import com.onboardpro.employee.entity.EmployeeStatus;
import com.onboardpro.employee.service.EmployeeService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/employees")
@RequiredArgsConstructor
public class EmployeeController {

    private final EmployeeService employeeService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER')")
    public ApiResponse<EmployeeResponse> createEmployee(@Valid @RequestBody EmployeeCreateRequest request) {
        return ApiResponse.success("Employee created", employeeService.createEmployee(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER')")
    public ApiResponse<EmployeeResponse> updateEmployee(@PathVariable Long id, @Valid @RequestBody EmployeeUpdateRequest request) {
        return ApiResponse.success("Employee updated", employeeService.updateEmployee(id, request));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER')")
    public ApiResponse<EmployeeResponse> updateStatus(@PathVariable Long id, @Valid @RequestBody EmployeeStatusUpdateRequest request) {
        return ApiResponse.success("Employee status updated", employeeService.updateStatus(id, request));
    }

    @GetMapping("/by-email")
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER','DEPARTMENT_MANAGER','IT_MANAGER','IT_ADMIN','EMPLOYEE')")
    public ApiResponse<EmployeeResponse> getEmployeeByEmail(@RequestParam String email) {
        return ApiResponse.success("Employee fetched", employeeService.getEmployeeByEmail(email));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER','DEPARTMENT_MANAGER','IT_MANAGER','IT_ADMIN','EMPLOYEE')")
    public ApiResponse<EmployeeResponse> getEmployee(@PathVariable Long id) {
        return ApiResponse.success("Employee fetched", employeeService.getEmployee(id));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER','DEPARTMENT_MANAGER','IT_MANAGER','IT_ADMIN')")
    public ApiResponse<List<EmployeeResponse>> listEmployees(@RequestParam(required = false) EmployeeStatus status) {
        return ApiResponse.success("Employees fetched", employeeService.listEmployees(status));
    }
}
