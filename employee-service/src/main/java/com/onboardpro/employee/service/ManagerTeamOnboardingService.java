package com.onboardpro.employee.service;

import com.onboardpro.employee.dto.ManagerTeamOnboardingResponse;
import java.util.List;

public interface ManagerTeamOnboardingService {
    List<ManagerTeamOnboardingResponse> listTeamOnboarding(String managerEmail);
}
