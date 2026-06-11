package com.onboardpro.employee.controller;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.onboardpro.employee.dto.HrDocumentVerificationReportRowDTO;
import com.onboardpro.employee.dto.HrOnboardingCompletionReportRowDTO;
import com.onboardpro.employee.dto.HrPendingTaskReportRowDTO;
import com.onboardpro.employee.entity.DocumentStatus;
import com.onboardpro.employee.entity.OnboardingStatus;
import com.onboardpro.employee.entity.RoleName;
import com.onboardpro.employee.entity.TaskStatus;
import com.onboardpro.employee.service.HrReportService;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

class HrReportControllerTest {

    private final HrReportService hrReportService = org.mockito.Mockito.mock(HrReportService.class);
    private final MockMvc mockMvc = MockMvcBuilders
            .standaloneSetup(new HrReportController(hrReportService))
            .build();

    @Test
    void onboardingCompletionReportReturnsRows() throws Exception {
        when(hrReportService.onboardingCompletionReport())
                .thenReturn(List.of(new HrOnboardingCompletionReportRowDTO(
                        "EMP1001",
                        "Vasanth",
                        "vasanth@example.com",
                        "Engineering",
                        OnboardingStatus.COMPLETED,
                        100,
                        LocalDate.of(2026, 6, 1),
                        Instant.parse("2026-06-08T10:00:00Z")
                )));

        mockMvc.perform(get("/api/hr/reports/onboarding-completion"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].employeeCode").value("EMP1001"))
                .andExpect(jsonPath("$[0].onboardingStatus").value("COMPLETED"));
    }

    @Test
    void documentVerificationReportReturnsRows() throws Exception {
        when(hrReportService.documentVerificationReport())
                .thenReturn(List.of(new HrDocumentVerificationReportRowDTO(
                        10L,
                        "EMP1001",
                        "Vasanth",
                        "Engineering",
                        "Aadhaar Card",
                        "aadhaar.pdf",
                        DocumentStatus.VERIFIED,
                        "HR Manager",
                        Instant.parse("2026-06-08T10:00:00Z"),
                        Instant.parse("2026-06-08T09:00:00Z")
                )));

        mockMvc.perform(get("/api/hr/reports/document-verification"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].documentId").value(10))
                .andExpect(jsonPath("$[0].status").value("VERIFIED"));
    }

    @Test
    void pendingTasksReportReturnsRows() throws Exception {
        when(hrReportService.pendingTaskReport())
                .thenReturn(List.of(new HrPendingTaskReportRowDTO(
                        20L,
                        "EMP1001",
                        "Vasanth",
                        "Engineering",
                        "Upload required documents",
                        RoleName.EMPLOYEE,
                        TaskStatus.PENDING,
                        LocalDate.of(2026, 6, 10),
                        Instant.parse("2026-06-08T09:00:00Z")
                )));

        mockMvc.perform(get("/api/hr/reports/pending-tasks"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].taskId").value(20))
                .andExpect(jsonPath("$[0].status").value("PENDING"));
    }
}
