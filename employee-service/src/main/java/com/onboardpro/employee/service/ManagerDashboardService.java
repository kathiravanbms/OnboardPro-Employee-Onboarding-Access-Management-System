package com.onboardpro.employee.service;

import com.onboardpro.employee.dto.ManagerDashboardResponse;

public interface ManagerDashboardService {
    ManagerDashboardResponse dashboard(String managerEmail);
}
