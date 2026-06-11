package com.onboardpro.employee.controller;

import com.onboardpro.employee.dto.ApiResponse;
import com.onboardpro.employee.dto.EmployeeDashboardSummaryDTO;
import com.onboardpro.employee.service.EmployeeDashboardService;
import java.security.Principal;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/employee")
@RequiredArgsConstructor
public class EmployeeDashboardController {

    private final EmployeeDashboardService employeeDashboardService;

    @GetMapping("/dashboard-summary")
    @PreAuthorize("hasRole('EMPLOYEE')")
    public ApiResponse<EmployeeDashboardSummaryDTO> dashboardSummary(Principal principal) {
        String employeeEmail = principal == null ? "" : principal.getName();
        return ApiResponse.success("Employee dashboard summary fetched", employeeDashboardService.getDashboardSummary(employeeEmail));
    }
}
