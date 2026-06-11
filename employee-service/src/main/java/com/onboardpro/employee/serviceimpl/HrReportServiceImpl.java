package com.onboardpro.employee.serviceimpl;

import com.onboardpro.employee.dto.HrDocumentVerificationReportRowDTO;
import com.onboardpro.employee.dto.HrOnboardingCompletionReportRowDTO;
import com.onboardpro.employee.dto.HrPendingTaskReportRowDTO;
import com.onboardpro.employee.entity.Document;
import com.onboardpro.employee.entity.Employee;
import com.onboardpro.employee.entity.OnboardingStatus;
import com.onboardpro.employee.entity.OnboardingTask;
import com.onboardpro.employee.entity.TaskStatus;
import com.onboardpro.employee.repository.DocumentRepository;
import com.onboardpro.employee.repository.EmployeeRepository;
import com.onboardpro.employee.repository.OnboardingTaskRepository;
import com.onboardpro.employee.service.HrReportService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class HrReportServiceImpl implements HrReportService {

    private final EmployeeRepository employeeRepository;
    private final DocumentRepository documentRepository;
    private final OnboardingTaskRepository onboardingTaskRepository;

    @Override
    @Transactional(readOnly = true)
    public List<HrOnboardingCompletionReportRowDTO> onboardingCompletionReport() {
        return employeeRepository.findByOnboardingStatusOrderByUpdatedAtDesc(OnboardingStatus.COMPLETED)
                .stream()
                .map(this::onboardingCompletionRow)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<HrDocumentVerificationReportRowDTO> documentVerificationReport() {
        return documentRepository.findAllByOrderByUpdatedAtDesc()
                .stream()
                .map(this::documentVerificationRow)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<HrPendingTaskReportRowDTO> pendingTaskReport() {
        return onboardingTaskRepository.findByStatusOrderByDueDateAsc(TaskStatus.PENDING)
                .stream()
                .map(this::pendingTaskRow)
                .toList();
    }

    private HrOnboardingCompletionReportRowDTO onboardingCompletionRow(Employee employee) {
        return new HrOnboardingCompletionReportRowDTO(
                employee.getEmployeeCode(),
                employee.getFullName(),
                employee.getEmail(),
                employee.getDepartment().getName(),
                employee.getOnboardingStatus(),
                employee.getOnboardingProgress(),
                employee.getStartDate(),
                employee.getUpdatedAt()
        );
    }

    private HrDocumentVerificationReportRowDTO documentVerificationRow(Document document) {
        Employee employee = document.getEmployee();
        return new HrDocumentVerificationReportRowDTO(
                document.getId(),
                employee.getEmployeeCode(),
                employee.getFullName(),
                employee.getDepartment().getName(),
                document.getDocumentType(),
                document.getFileName(),
                document.getStatus(),
                document.getReviewedBy(),
                document.getReviewedAt(),
                document.getCreatedAt()
        );
    }

    private HrPendingTaskReportRowDTO pendingTaskRow(OnboardingTask task) {
        Employee employee = task.getEmployee();
        return new HrPendingTaskReportRowDTO(
                task.getId(),
                employee.getEmployeeCode(),
                employee.getFullName(),
                employee.getDepartment().getName(),
                task.getTitle(),
                task.getAssignedRole(),
                task.getStatus(),
                task.getDueDate(),
                task.getCreatedAt()
        );
    }
}
