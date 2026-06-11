package com.onboardpro.employee.serviceimpl;

import com.onboardpro.employee.dto.TaskRequest;
import com.onboardpro.employee.dto.TaskResponse;
import com.onboardpro.employee.dto.TaskStatusUpdateRequest;
import com.onboardpro.employee.entity.Employee;
import com.onboardpro.employee.entity.OnboardingStatus;
import com.onboardpro.employee.entity.OnboardingTask;
import com.onboardpro.employee.entity.TaskStatus;
import com.onboardpro.employee.exception.ResourceNotFoundException;
import com.onboardpro.employee.repository.EmployeeRepository;
import com.onboardpro.employee.repository.OnboardingTaskRepository;
import com.onboardpro.employee.service.TaskService;
import java.time.Instant;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class TaskServiceImpl implements TaskService {

    private final OnboardingTaskRepository taskRepository;
    private final EmployeeRepository employeeRepository;

    @Override
    @Transactional
    public TaskResponse createTask(TaskRequest request) {
        Employee employee = findEmployee(request.employeeId());
        OnboardingTask task = OnboardingTask.builder()
                .employee(employee)
                .title(request.title().trim())
                .description(request.description())
                .assignedRole(request.assignedRole())
                .status(TaskStatus.PENDING)
                .dueDate(request.dueDate())
                .build();
        return ResponseMapper.task(taskRepository.save(task));
    }

    @Override
    @Transactional
    public TaskResponse updateTaskStatus(Long taskId, TaskStatusUpdateRequest request) {
        OnboardingTask task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found"));
        task.setStatus(request.status());
        task.setCompletedAt(request.status() == TaskStatus.COMPLETED ? Instant.now() : null);
        OnboardingTask saved = taskRepository.save(task);
        updateEmployeeProgress(saved.getEmployee());
        return ResponseMapper.task(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<TaskResponse> listTasks(Long employeeId) {
        List<OnboardingTask> tasks = employeeId == null ? taskRepository.findAll() : taskRepository.findByEmployeeId(employeeId);
        return tasks.stream().map(ResponseMapper::task).toList();
    }

    void updateEmployeeProgress(Employee employee) {
        long total = taskRepository.countByEmployeeId(employee.getId());
        long completed = taskRepository.countByEmployeeIdAndStatus(employee.getId(), TaskStatus.COMPLETED);
        int progress = total == 0 ? 0 : (int) Math.round((completed * 100.0) / total);
        employee.setOnboardingProgress(progress);
        if (progress >= 100) {
            employee.setOnboardingStatus(OnboardingStatus.COMPLETED);
        } else if (progress > 0) {
            employee.setOnboardingStatus(OnboardingStatus.IN_PROGRESS);
        }
        employeeRepository.save(employee);
    }

    private Employee findEmployee(Long id) {
        return employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));
    }
}
