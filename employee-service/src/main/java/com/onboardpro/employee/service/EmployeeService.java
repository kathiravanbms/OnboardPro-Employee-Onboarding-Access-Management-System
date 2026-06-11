package com.onboardpro.employee.service;

import com.onboardpro.employee.dto.EmployeeCreateRequest;
import com.onboardpro.employee.dto.EmployeeResponse;
import com.onboardpro.employee.dto.EmployeeStatusUpdateRequest;
import com.onboardpro.employee.dto.EmployeeUpdateRequest;
import com.onboardpro.employee.entity.EmployeeStatus;
import java.util.List;

public interface EmployeeService {
    EmployeeResponse createEmployee(EmployeeCreateRequest request);
    EmployeeResponse updateEmployee(Long id, EmployeeUpdateRequest request);
    EmployeeResponse updateStatus(Long id, EmployeeStatusUpdateRequest request);
    EmployeeResponse getEmployee(Long id);
    EmployeeResponse getEmployeeByEmail(String email);
    List<EmployeeResponse> listEmployees(EmployeeStatus status);
}
