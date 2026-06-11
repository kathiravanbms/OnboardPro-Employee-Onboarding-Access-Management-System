package com.onboardpro.employee.controller;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.onboardpro.employee.dto.HrDashboardSummaryDTO;
import com.onboardpro.employee.service.HrDashboardService;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

class HrDashboardControllerTest {

    private final HrDashboardService hrDashboardService = org.mockito.Mockito.mock(HrDashboardService.class);
    private final MockMvc mockMvc = MockMvcBuilders
            .standaloneSetup(new HrDashboardController(hrDashboardService))
            .build();

    @Test
    void dashboardSummaryReturnsHrCounts() throws Exception {
        when(hrDashboardService.getDashboardSummary())
                .thenReturn(new HrDashboardSummaryDTO(
                        8,
                        3,
                        2,
                        5,
                        new HrDashboardSummaryDTO.LifecycleDTO(2, 0, 1, 5)
                ));

        mockMvc.perform(get("/api/hr/dashboard-summary"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalEmployees").value(8))
                .andExpect(jsonPath("$.activeOnboardings").value(3))
                .andExpect(jsonPath("$.docsPendingVerification").value(2))
                .andExpect(jsonPath("$.completedThisMonth").value(5))
                .andExpect(jsonPath("$.lifecycle.initiated").value(2))
                .andExpect(jsonPath("$.lifecycle.inProgress").value(0))
                .andExpect(jsonPath("$.lifecycle.pendingApproval").value(1))
                .andExpect(jsonPath("$.lifecycle.completed").value(5));
    }
}
