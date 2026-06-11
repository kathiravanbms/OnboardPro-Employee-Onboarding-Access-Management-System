package com.onboardpro.employee.controller;

import com.onboardpro.employee.dto.HrDocumentVerificationReportRowDTO;
import com.onboardpro.employee.dto.HrOnboardingCompletionReportRowDTO;
import com.onboardpro.employee.dto.HrPendingTaskReportRowDTO;
import com.onboardpro.employee.service.HrReportService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/hr/reports")
@RequiredArgsConstructor
public class HrReportController {

    private final HrReportService hrReportService;

    @GetMapping("/onboarding-completion")
    @PreAuthorize("hasRole('HR_MANAGER')")
    public List<HrOnboardingCompletionReportRowDTO> onboardingCompletionReport() {
        return hrReportService.onboardingCompletionReport();
    }

    @GetMapping("/document-verification")
    @PreAuthorize("hasRole('HR_MANAGER')")
    public List<HrDocumentVerificationReportRowDTO> documentVerificationReport() {
        return hrReportService.documentVerificationReport();
    }

    @GetMapping("/pending-tasks")
    @PreAuthorize("hasRole('HR_MANAGER')")
    public List<HrPendingTaskReportRowDTO> pendingTaskReport() {
        return hrReportService.pendingTaskReport();
    }
}
