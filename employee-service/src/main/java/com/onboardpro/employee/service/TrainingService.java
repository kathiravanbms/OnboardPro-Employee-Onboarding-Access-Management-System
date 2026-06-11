package com.onboardpro.employee.service;

import com.onboardpro.employee.dto.TrainingCompletionRequest;
import com.onboardpro.employee.dto.TrainingModuleRequest;
import com.onboardpro.employee.dto.TrainingModuleResponse;
import com.onboardpro.employee.dto.TrainingProgressResponse;
import java.util.List;

public interface TrainingService {
    TrainingModuleResponse createModule(TrainingModuleRequest request);
    List<TrainingModuleResponse> listModules();
    TrainingProgressResponse getEmployeeTraining(Long employeeId);
    TrainingProgressResponse completeModule(Long moduleId, TrainingCompletionRequest request);
}
