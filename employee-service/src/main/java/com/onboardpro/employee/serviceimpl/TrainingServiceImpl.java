package com.onboardpro.employee.serviceimpl;

import com.onboardpro.employee.dto.TrainingCompletionRequest;
import com.onboardpro.employee.dto.TrainingModuleRequest;
import com.onboardpro.employee.dto.TrainingModuleResponse;
import com.onboardpro.employee.dto.TrainingProgressResponse;
import com.onboardpro.employee.entity.Employee;
import com.onboardpro.employee.entity.Notification;
import com.onboardpro.employee.entity.TrainingCompletion;
import com.onboardpro.employee.entity.TrainingModule;
import com.onboardpro.employee.exception.ResourceNotFoundException;
import com.onboardpro.employee.repository.EmployeeRepository;
import com.onboardpro.employee.repository.NotificationRepository;
import com.onboardpro.employee.repository.TrainingCompletionRepository;
import com.onboardpro.employee.repository.TrainingModuleRepository;
import com.onboardpro.employee.service.TrainingService;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class TrainingServiceImpl implements TrainingService {

    private static final String COMPLETED_NOTIFICATION_TYPE = "TRAINING_COMPLETED";

    private final TrainingModuleRepository trainingModuleRepository;
    private final TrainingCompletionRepository trainingCompletionRepository;
    private final EmployeeRepository employeeRepository;
    private final NotificationRepository notificationRepository;
    private final OnboardingServiceImpl onboardingService;
    private final AuditLogServiceImpl auditLogService;

    @Override
    @Transactional
    public TrainingModuleResponse createModule(TrainingModuleRequest request) {
        TrainingModule module = TrainingModule.builder()
                .title(request.title().trim())
                .description(request.description().trim())
                .videoUrl(request.videoUrl().trim())
                .pdfUrl(request.pdfUrl().trim())
                .uploadDate(Instant.now())
                .build();
        TrainingModule saved = trainingModuleRepository.save(module);
        auditLogService.record(
                "HR Manager",
                "HR Manager",
                "Training",
                "Training module created",
                "Training module created: %s.".formatted(saved.getTitle()),
                null,
                null
        );
        return mapModule(saved, null);
    }

    @Override
    @Transactional(readOnly = true)
    public List<TrainingModuleResponse> listModules() {
        return trainingModuleRepository.findAllByOrderByUploadDateDesc().stream()
                .map(module -> mapModule(module, null))
                .toList();
    }

    @Override
    @Transactional
    public TrainingProgressResponse getEmployeeTraining(Long employeeId) {
        Employee employee = findEmployee(employeeId);
        TrainingProgressResponse response = progress(employee);
        if ("Completed".equals(response.trainingStatus())) {
            onboardingService.completeTrainingWorkflow(employee);
        }
        return response;
    }

    @Override
    @Transactional
    public TrainingProgressResponse completeModule(Long moduleId, TrainingCompletionRequest request) {
        Employee employee = findEmployee(request.employeeId());
        TrainingModule module = trainingModuleRepository.findById(moduleId)
                .orElseThrow(() -> new ResourceNotFoundException("Training module not found"));

        if (!trainingCompletionRepository.existsByEmployeeIdAndTrainingModuleId(employee.getId(), module.getId())) {
            trainingCompletionRepository.save(TrainingCompletion.builder()
                    .employee(employee)
                    .trainingModule(module)
                    .build());
            auditLogService.record(
                    employee.getFullName(),
                    "Employee",
                    "Training",
                    "Training completion",
                    "%s completed training module %s.".formatted(employee.getFullName(), module.getTitle()),
                    employee.getId(),
                    employee.getFullName()
            );
        }

        TrainingProgressResponse response = progress(employee);
        if ("Completed".equals(response.trainingStatus())) {
            onboardingService.completeTrainingWorkflow(employee);
            notifyTrainingCompleted(employee);
            response = progress(findEmployee(employee.getId()));
        }
        return response;
    }

    private TrainingProgressResponse progress(Employee employee) {
        List<TrainingModule> modules = trainingModuleRepository.findAllByOrderByUploadDateDesc();
        Map<Long, TrainingCompletion> completionsByModuleId = trainingCompletionRepository.findByEmployeeId(employee.getId()).stream()
                .collect(Collectors.toMap(item -> item.getTrainingModule().getId(), Function.identity(), (left, right) -> left));
        long total = modules.size();
        long completed = modules.stream().filter(module -> completionsByModuleId.containsKey(module.getId())).count();
        int progress = total == 0 ? 0 : (int) Math.round((completed * 100.0) / total);
        String status = total > 0 && completed == total ? "Completed" : "In Progress";
        List<TrainingModuleResponse> moduleResponses = modules.stream()
                .map(module -> mapModule(module, completionsByModuleId.get(module.getId())))
                .toList();

        return new TrainingProgressResponse(
                employee.getId(),
                employee.getEmployeeCode(),
                employee.getFullName(),
                status,
                progress,
                total,
                completed,
                moduleResponses
        );
    }

    private TrainingModuleResponse mapModule(TrainingModule module, TrainingCompletion completion) {
        return new TrainingModuleResponse(
                module.getId(),
                module.getTitle(),
                module.getDescription(),
                module.getVideoUrl(),
                module.getPdfUrl(),
                module.getUploadDate(),
                completion != null,
                completion == null ? null : completion.getCompletedAt()
        );
    }

    private Employee findEmployee(Long id) {
        return employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));
    }

    private void notifyTrainingCompleted(Employee employee) {
        Set<String> existingTypes = notificationRepository.findByRecipientUserIdOrderByCreatedAtDesc(employee.getId()).stream()
                .map(Notification::getNotificationType)
                .collect(Collectors.toSet());
        if (existingTypes.contains(COMPLETED_NOTIFICATION_TYPE)) {
            return;
        }

        notificationRepository.save(Notification.builder()
                .employee(employee)
                .recipientUserId(employee.getId())
                .recipientEmail(employee.getEmail())
                .recipientRole("Employee")
                .notificationType(COMPLETED_NOTIFICATION_TYPE)
                .title("Training completed")
                .message("You completed all assigned training modules. Training progress is now 100%.")
                .readFlag(false)
                .build());
    }
}
