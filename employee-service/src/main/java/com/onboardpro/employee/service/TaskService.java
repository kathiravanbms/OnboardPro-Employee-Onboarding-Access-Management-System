package com.onboardpro.employee.service;

import com.onboardpro.employee.dto.TaskRequest;
import com.onboardpro.employee.dto.TaskResponse;
import com.onboardpro.employee.dto.TaskStatusUpdateRequest;
import java.util.List;

public interface TaskService {
    TaskResponse createTask(TaskRequest request);
    TaskResponse updateTaskStatus(Long taskId, TaskStatusUpdateRequest request);
    List<TaskResponse> listTasks(Long employeeId);
}
