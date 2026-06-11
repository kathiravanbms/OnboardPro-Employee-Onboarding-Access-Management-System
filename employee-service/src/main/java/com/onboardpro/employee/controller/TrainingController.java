package com.onboardpro.employee.controller;

import com.onboardpro.employee.dto.ApiResponse;
import com.onboardpro.employee.dto.TrainingCompletionRequest;
import com.onboardpro.employee.dto.TrainingModuleRequest;
import com.onboardpro.employee.dto.TrainingModuleResponse;
import com.onboardpro.employee.dto.TrainingProgressResponse;
import com.onboardpro.employee.service.TrainingService;
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
@RequestMapping("/api/training")
@RequiredArgsConstructor
public class TrainingController {

    private final TrainingService trainingService;

    @PostMapping("/modules")
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER')")
    public ApiResponse<TrainingModuleResponse> createModule(@Valid @RequestBody TrainingModuleRequest request) {
        return ApiResponse.success("Training module created", trainingService.createModule(request));
    }

    @GetMapping("/modules")
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER','EMPLOYEE')")
    public ApiResponse<List<TrainingModuleResponse>> listModules() {
        return ApiResponse.success("Training modules fetched", trainingService.listModules());
    }

    @GetMapping("/employees/{employeeId}")
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER','EMPLOYEE')")
    public ApiResponse<TrainingProgressResponse> getEmployeeTraining(@PathVariable Long employeeId) {
        return ApiResponse.success("Employee training fetched", trainingService.getEmployeeTraining(employeeId));
    }

    @GetMapping("/employee/{employeeId}")
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER','EMPLOYEE')")
    public ApiResponse<TrainingProgressResponse> getEmployeeTrainingByEmployee(@PathVariable Long employeeId) {
        return ApiResponse.success("Employee training fetched", trainingService.getEmployeeTraining(employeeId));
    }

    @GetMapping("/employee")
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER','EMPLOYEE')")
    public ApiResponse<TrainingProgressResponse> getEmployeeTrainingByEmployeeQuery(@RequestParam Long employeeId) {
        return ApiResponse.success("Employee training fetched", trainingService.getEmployeeTraining(employeeId));
    }

    @GetMapping("/employee-training")
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER','EMPLOYEE')")
    public ApiResponse<TrainingProgressResponse> getEmployeeTrainingByDescriptiveQuery(@RequestParam Long employeeId) {
        return ApiResponse.success("Employee training fetched", trainingService.getEmployeeTraining(employeeId));
    }

    @PatchMapping("/modules/{moduleId}/complete")
    @PreAuthorize("hasAnyRole('ADMIN','EMPLOYEE')")
    public ApiResponse<TrainingProgressResponse> completeModule(
            @PathVariable Long moduleId,
            @Valid @RequestBody TrainingCompletionRequest request) {
        return ApiResponse.success("Training module completed", trainingService.completeModule(moduleId, request));
    }
}
