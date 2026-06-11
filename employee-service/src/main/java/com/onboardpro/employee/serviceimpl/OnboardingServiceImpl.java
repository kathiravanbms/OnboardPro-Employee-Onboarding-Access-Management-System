package com.onboardpro.employee.serviceimpl;

import com.onboardpro.employee.dto.EmployeeResponse;
import com.onboardpro.employee.dto.OnboardingProgressResponse;
import com.onboardpro.employee.dto.PersonalDetailsRequest;
import com.onboardpro.employee.dto.PolicyAcknowledgmentRequest;
import com.onboardpro.employee.dto.TaskResponse;
import com.onboardpro.employee.entity.Employee;
import com.onboardpro.employee.entity.OnboardingStatus;
import com.onboardpro.employee.entity.OnboardingTask;
import com.onboardpro.employee.entity.RoleName;
import com.onboardpro.employee.entity.TaskStatus;
import com.onboardpro.employee.exception.BusinessException;
import com.onboardpro.employee.exception.ResourceNotFoundException;
import com.onboardpro.employee.repository.EmployeeRepository;
import com.onboardpro.employee.repository.OnboardingTaskRepository;
import com.onboardpro.employee.service.OnboardingService;
import java.time.Instant;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class OnboardingServiceImpl implements OnboardingService {

    static final String PERSONAL_DETAILS_TASK = "Personal Details Submission";
    static final String DOCUMENT_UPLOAD_TASK = "Document Upload";
    static final String POLICY_ACKNOWLEDGMENT_TASK = "Policy Acknowledgment";
    static final String TRAINING_COMPLETION_TASK = "Training Completion";

    private final EmployeeRepository employeeRepository;
    private final OnboardingTaskRepository taskRepository;
    private final TaskServiceImpl taskService;

    @Override
    @Transactional
    public OnboardingProgressResponse initiateOnboarding(Long employeeId) {
        Employee employee = findEmployee(employeeId);
        employee.setOnboardingStatus(OnboardingStatus.INITIATED);
        employee.setOnboardingProgress(0);
        employeeRepository.save(employee);
        if (taskRepository.countByEmployeeId(employeeId) == 0) {
            defaultTasksForEmployee(employeeId);
        }
        return progress(employee);
    }

    @Override
    @Transactional(readOnly = true)
    public OnboardingProgressResponse getProgress(Long employeeId) {
        return progress(findEmployee(employeeId));
    }

    @Override
    @Transactional(readOnly = true)
    public EmployeeResponse getEmployeeByEmail(String email) {
        return ResponseMapper.employee(employeeRepository.findByEmailIgnoreCase(email.trim())
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found")));
    }

    @Override
    @Transactional
    public EmployeeResponse submitPersonalDetails(Long employeeId, PersonalDetailsRequest request) {
        Employee employee = findEmployee(employeeId);
        ensureCoreWorkflowTasks(employee);

        employee.setPhoneNumber(request.phoneNumber().trim());
        employee.setDateOfBirth(request.dateOfBirth());
        employee.setGender(request.gender().trim());
        employee.setAddress(request.address().trim());
        employee.setEmergencyContactName(request.emergencyContactName().trim());
        employee.setEmergencyContactPhone(request.emergencyContactPhone().trim());
        employeeRepository.save(employee);

        completeWorkflowTask(employee, PERSONAL_DETAILS_TASK, "Complete profile");
        taskService.updateEmployeeProgress(employee);
        return ResponseMapper.employee(findEmployee(employeeId));
    }

    @Override
    @Transactional
    public EmployeeResponse acknowledgePolicies(Long employeeId, PolicyAcknowledgmentRequest request) {
        Employee employee = findEmployee(employeeId);
        ensureCoreWorkflowTasks(employee);

        if (!isWorkflowTaskCompleted(employee, DOCUMENT_UPLOAD_TASK, "Upload required documents")) {
            throw new BusinessException("Document Upload must be completed before Policy Acknowledgment");
        }

        if (!(request.conduct()
                && request.workingHours()
                && request.antiHarassment()
                && request.dataSecurity()
                && request.healthSafety())) {
            throw new BusinessException("All policies must be acknowledged");
        }

        employee.setPolicyConductAcknowledged(true);
        employee.setPolicyWorkingHoursAcknowledged(true);
        employee.setPolicyAntiHarassmentAcknowledged(true);
        employee.setPolicyDataSecurityAcknowledged(true);
        employee.setPolicyHealthSafetyAcknowledged(true);
        employeeRepository.save(employee);

        completeWorkflowTask(employee, POLICY_ACKNOWLEDGMENT_TASK);
        taskService.updateEmployeeProgress(employee);
        return ResponseMapper.employee(findEmployee(employeeId));
    }

    @Override
    @Transactional
    public OnboardingProgressResponse completeOnboarding(Long employeeId) {
        Employee employee = findEmployee(employeeId);
        employee.setOnboardingStatus(OnboardingStatus.COMPLETED);
        employee.setOnboardingProgress(100);
        employeeRepository.save(employee);
        return progress(employee);
    }

    @Override
    @Transactional
    public TaskResponse completeTask(Long taskId) {
        OnboardingTask task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found"));
        task.setStatus(TaskStatus.COMPLETED);
        task.setCompletedAt(Instant.now());
        OnboardingTask saved = taskRepository.save(task);
        taskService.updateEmployeeProgress(saved.getEmployee());
        return ResponseMapper.task(saved);
    }

    @Override
    @Transactional
    public List<TaskResponse> defaultTasksForEmployee(Long employeeId) {
        Employee employee = findEmployee(employeeId);
        List<OnboardingTask> tasks = List.of(
                task(PERSONAL_DETAILS_TASK, RoleName.EMPLOYEE, employee),
                task(DOCUMENT_UPLOAD_TASK, RoleName.EMPLOYEE, employee),
                task(POLICY_ACKNOWLEDGMENT_TASK, RoleName.EMPLOYEE, employee),
                task(TRAINING_COMPLETION_TASK, RoleName.EMPLOYEE, employee)
        );
        return taskRepository.saveAll(tasks).stream().map(ResponseMapper::task).toList();
    }

    void ensureCoreWorkflowTasks(Employee employee) {
        ensureTask(employee, PERSONAL_DETAILS_TASK, "Complete profile");
        ensureTask(employee, DOCUMENT_UPLOAD_TASK, "Upload required documents");
        ensureTask(employee, POLICY_ACKNOWLEDGMENT_TASK);
        ensureTask(employee, TRAINING_COMPLETION_TASK);
    }

    void completeWorkflowTask(Employee employee, String title, String... aliases) {
        OnboardingTask task = findWorkflowTask(employee, title, aliases);
        if (task.getStatus() != TaskStatus.COMPLETED) {
            task.setStatus(TaskStatus.COMPLETED);
            task.setCompletedAt(Instant.now());
            taskRepository.save(task);
        }
    }

    void completeTrainingWorkflow(Employee employee) {
        ensureCoreWorkflowTasks(employee);
        completeWorkflowTask(employee, TRAINING_COMPLETION_TASK);
        taskService.updateEmployeeProgress(employee);
    }

    void refreshPersistedProgress(Employee employee) {
        ensureCoreWorkflowTasks(employee);
        taskService.updateEmployeeProgress(employee);
    }

    void setWorkflowTaskStatus(Employee employee, String title, TaskStatus status, String... aliases) {
        OnboardingTask task = findWorkflowTask(employee, title, aliases);
        if (task.getStatus() != TaskStatus.COMPLETED) {
            task.setStatus(status);
            task.setCompletedAt(status == TaskStatus.COMPLETED ? Instant.now() : null);
            taskRepository.save(task);
        }
    }

    boolean isWorkflowTaskCompleted(Employee employee, String title, String... aliases) {
        return findWorkflowTask(employee, title, aliases).getStatus() == TaskStatus.COMPLETED;
    }

    private OnboardingTask findWorkflowTask(Employee employee, String title, String... aliases) {
        return taskRepository.findByEmployeeId(employee.getId()).stream()
                .filter(task -> matchesTitle(task.getTitle(), title, aliases))
                .findFirst()
                .orElseGet(() -> taskRepository.save(task(title, RoleName.EMPLOYEE, employee)));
    }

    private void ensureTask(Employee employee, String title, String... aliases) {
        boolean exists = taskRepository.findByEmployeeId(employee.getId()).stream()
                .anyMatch(task -> matchesTitle(task.getTitle(), title, aliases));
        if (!exists) {
            taskRepository.save(task(title, RoleName.EMPLOYEE, employee));
        }
    }

    private boolean matchesTitle(String actual, String title, String... aliases) {
        if (actual.equalsIgnoreCase(title)) {
            return true;
        }
        for (String alias : aliases) {
            if (actual.equalsIgnoreCase(alias)) {
                return true;
            }
        }
        return false;
    }

    private OnboardingTask task(String title, RoleName role, Employee employee) {
        return OnboardingTask.builder()
                .employee(employee)
                .title(title)
                .description(title)
                .assignedRole(role)
                .status(TaskStatus.PENDING)
                .build();
    }

    private OnboardingProgressResponse progress(Employee employee) {
        long total = taskRepository.countByEmployeeId(employee.getId());
        long completed = taskRepository.countByEmployeeIdAndStatus(employee.getId(), TaskStatus.COMPLETED);
        return new OnboardingProgressResponse(
                employee.getId(),
                employee.getEmployeeCode(),
                employee.getOnboardingStatus(),
                employee.getOnboardingProgress(),
                total,
                completed
        );
    }

    private Employee findEmployee(Long id) {
        return employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));
    }
}
