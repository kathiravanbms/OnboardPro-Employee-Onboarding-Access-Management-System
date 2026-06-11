package com.onboardpro.employee.controller;

import com.onboardpro.employee.dto.HrDashboardSummaryDTO;
import com.onboardpro.employee.service.HrDashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/hr")
@RequiredArgsConstructor
public class HrDashboardController {

    private final HrDashboardService hrDashboardService;

    @GetMapping("/dashboard-summary")
    @PreAuthorize("hasRole('HR_MANAGER')")
    public HrDashboardSummaryDTO dashboardSummary() {
        return hrDashboardService.getDashboardSummary();
    }
}
