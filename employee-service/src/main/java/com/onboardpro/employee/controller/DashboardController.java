package com.onboardpro.employee.controller;

import com.onboardpro.employee.dto.DashboardSummaryDTO;
import com.onboardpro.employee.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/dashboard-summary")
    @PreAuthorize("hasRole('ADMIN')")
    public DashboardSummaryDTO dashboardSummary() {
        return dashboardService.getAdminDashboardSummary();
    }
}
