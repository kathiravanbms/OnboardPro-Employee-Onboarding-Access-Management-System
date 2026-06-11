package com.onboardpro.employee.service;

import com.onboardpro.employee.dto.OnboardingProgressResponse;
import com.onboardpro.employee.dto.EmployeeResponse;
import com.onboardpro.employee.dto.PersonalDetailsRequest;
import com.onboardpro.employee.dto.PolicyAcknowledgmentRequest;
import com.onboardpro.employee.dto.TaskResponse;
import java.util.List;

public interface OnboardingService {
    OnboardingProgressResponse initiateOnboarding(Long employeeId);
    OnboardingProgressResponse getProgress(Long employeeId);
    EmployeeResponse getEmployeeByEmail(String email);
    EmployeeResponse submitPersonalDetails(Long employeeId, PersonalDetailsRequest request);
    EmployeeResponse acknowledgePolicies(Long employeeId, PolicyAcknowledgmentRequest request);
    OnboardingProgressResponse completeOnboarding(Long employeeId);
    TaskResponse completeTask(Long taskId);
    List<TaskResponse> defaultTasksForEmployee(Long employeeId);
}
