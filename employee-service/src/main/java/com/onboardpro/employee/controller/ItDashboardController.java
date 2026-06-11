package com.onboardpro.employee.controller;

import com.onboardpro.employee.dto.ApiResponse;
import com.onboardpro.employee.dto.ItDashboardResponse;
import com.onboardpro.employee.service.ItDashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/it")
@RequiredArgsConstructor
public class ItDashboardController {

    private final ItDashboardService itDashboardService;

    @GetMapping("/dashboard")
    @PreAuthorize("hasAnyRole('ADMIN','IT_MANAGER','IT_ADMIN')")
    public ApiResponse<ItDashboardResponse> dashboard() {
        return ApiResponse.success(
                "IT dashboard fetched successfully",
                itDashboardService.dashboard()
        );
    }
}
