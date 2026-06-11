package com.onboardpro.employee.service;

import com.onboardpro.employee.dto.EmployeeDashboardSummaryDTO;

public interface EmployeeDashboardService {
    EmployeeDashboardSummaryDTO getDashboardSummary(String employeeEmail);
}
