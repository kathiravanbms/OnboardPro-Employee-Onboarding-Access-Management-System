package com.onboardpro.employee.controller;

import com.onboardpro.employee.dto.ApiResponse;
import com.onboardpro.employee.dto.ManagerReportResponse;
import com.onboardpro.employee.dto.ReportSummaryResponse;
import com.onboardpro.employee.service.ReportService;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    @GetMapping("/summary")
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER')")
    public ApiResponse<ReportSummaryResponse> summary() {
        return ApiResponse.success("Report summary fetched", reportService.summary());
    }

    @GetMapping("/manager")
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER','DEPARTMENT_MANAGER')")
    public ApiResponse<ManagerReportResponse> managerReport() {
        return ApiResponse.success("Manager report fetched", reportService.managerReport());
    }

    @GetMapping("/onboarding")
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER')")
    public ApiResponse<List<Map<String, Object>>> onboardingReport() {
        return ApiResponse.success("Onboarding report fetched", reportService.onboardingReport());
    }

    @GetMapping("/pending-tasks")
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER','DEPARTMENT_MANAGER','IT_MANAGER','IT_ADMIN')")
    public ApiResponse<List<Map<String, Object>>> pendingTaskReport() {
        return ApiResponse.success("Pending task report fetched", reportService.pendingTaskReport());
    }

    @GetMapping("/approvals")
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER','DEPARTMENT_MANAGER')")
    public ApiResponse<List<Map<String, Object>>> approvalReport() {
        return ApiResponse.success("Approval report fetched", reportService.approvalReport());
    }
}
