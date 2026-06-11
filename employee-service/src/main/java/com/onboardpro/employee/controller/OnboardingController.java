package com.onboardpro.employee.controller;

import com.onboardpro.employee.dto.ApiResponse;
import com.onboardpro.employee.dto.EmployeeResponse;
import com.onboardpro.employee.dto.OnboardingProgressResponse;
import com.onboardpro.employee.dto.PersonalDetailsRequest;
import com.onboardpro.employee.dto.PolicyAcknowledgmentRequest;
import com.onboardpro.employee.dto.TaskResponse;
import com.onboardpro.employee.service.OnboardingService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/onboarding")
@RequiredArgsConstructor
public class OnboardingController {

    private final OnboardingService onboardingService;

    @PostMapping("/{employeeId}/initiate")
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER')")
    public ApiResponse<OnboardingProgressResponse> initiate(@PathVariable Long employeeId) {
        return ApiResponse.success("Onboarding initiated", onboardingService.initiateOnboarding(employeeId));
    }

    @GetMapping("/{employeeId}/progress")
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER','DEPARTMENT_MANAGER','IT_MANAGER','IT_ADMIN','EMPLOYEE')")
    public ApiResponse<OnboardingProgressResponse> progress(@PathVariable Long employeeId) {
        return ApiResponse.success("Onboarding progress fetched", onboardingService.getProgress(employeeId));
    }

    @GetMapping("/employee")
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER','DEPARTMENT_MANAGER','IT_MANAGER','IT_ADMIN','EMPLOYEE')")
    public ApiResponse<EmployeeResponse> employeeByEmail(@RequestParam String email) {
        return ApiResponse.success("Employee fetched", onboardingService.getEmployeeByEmail(email));
    }

    @PatchMapping("/{employeeId}/personal-details")
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER','EMPLOYEE')")
    public ApiResponse<EmployeeResponse> personalDetails(@PathVariable Long employeeId, @Valid @RequestBody PersonalDetailsRequest request) {
        return ApiResponse.success("Personal details saved", onboardingService.submitPersonalDetails(employeeId, request));
    }

    @PatchMapping("/{employeeId}/policy-acknowledgment")
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER','EMPLOYEE')")
    public ApiResponse<EmployeeResponse> policyAcknowledgment(@PathVariable Long employeeId, @RequestBody PolicyAcknowledgmentRequest request) {
        return ApiResponse.success("Policies acknowledged", onboardingService.acknowledgePolicies(employeeId, request));
    }

    @PatchMapping("/{employeeId}/complete")
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER')")
    public ApiResponse<OnboardingProgressResponse> complete(@PathVariable Long employeeId) {
        return ApiResponse.success("Onboarding completed", onboardingService.completeOnboarding(employeeId));
    }

    @PostMapping("/{employeeId}/default-tasks")
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER')")
    public ApiResponse<List<TaskResponse>> createDefaultTasks(@PathVariable Long employeeId) {
        return ApiResponse.success("Default onboarding tasks created", onboardingService.defaultTasksForEmployee(employeeId));
    }

    @PatchMapping("/tasks/{taskId}/complete")
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER','DEPARTMENT_MANAGER','IT_MANAGER','IT_ADMIN','EMPLOYEE')")
    public ApiResponse<TaskResponse> completeTask(@PathVariable Long taskId) {
        return ApiResponse.success("Task completed", onboardingService.completeTask(taskId));
    }
}
