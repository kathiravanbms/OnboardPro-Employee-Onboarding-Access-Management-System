package com.onboardpro.employee.controller;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.onboardpro.employee.dto.DashboardSummaryDTO;
import com.onboardpro.employee.service.DashboardService;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

class DashboardControllerTest {

    private final DashboardService dashboardService = org.mockito.Mockito.mock(DashboardService.class);
    private final MockMvc mockMvc = MockMvcBuilders
            .standaloneSetup(new DashboardController(dashboardService))
            .build();

    @Test
    void dashboardSummaryReturnsCounts() throws Exception {
        when(dashboardService.getAdminDashboardSummary())
                .thenReturn(new DashboardSummaryDTO(41, 7, 35, 59));

        mockMvc.perform(get("/api/admin/dashboard-summary"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalUsers").value(41))
                .andExpect(jsonPath("$.activeEmployees").value(7))
                .andExpect(jsonPath("$.pendingTasks").value(35))
                .andExpect(jsonPath("$.notificationCount").value(59));
    }
}
