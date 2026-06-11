package com.onboardpro.employee.controller;

import com.onboardpro.employee.dto.ApiResponse;
import com.onboardpro.employee.dto.ManagerDashboardResponse;
import com.onboardpro.employee.dto.ManagerTeamOnboardingResponse;
import com.onboardpro.employee.service.ManagerDashboardService;
import com.onboardpro.employee.service.ManagerTeamOnboardingService;
import java.security.Principal;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/manager")
@RequiredArgsConstructor
public class ManagerDashboardController {

    private final ManagerDashboardService managerDashboardService;
    private final ManagerTeamOnboardingService managerTeamOnboardingService;

    @GetMapping("/dashboard")
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER','DEPARTMENT_MANAGER')")
    public ApiResponse<ManagerDashboardResponse> dashboard(Principal principal) {
        return ApiResponse.success(
                "Manager dashboard data fetched successfully",
                managerDashboardService.dashboard(principal.getName())
        );
    }

    @GetMapping("/team-onboarding")
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER','DEPARTMENT_MANAGER')")
    public ApiResponse<List<ManagerTeamOnboardingResponse>> teamOnboarding(Principal principal) {
        return ApiResponse.success(
                "Manager team onboarding fetched successfully",
                managerTeamOnboardingService.listTeamOnboarding(principal.getName())
        );
    }
}
