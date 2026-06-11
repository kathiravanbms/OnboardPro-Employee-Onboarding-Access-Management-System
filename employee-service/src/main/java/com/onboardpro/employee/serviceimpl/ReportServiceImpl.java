package com.onboardpro.employee.serviceimpl;

import com.onboardpro.employee.dto.ManagerReportResponse;
import com.onboardpro.employee.dto.ReportSummaryResponse;
import com.onboardpro.employee.entity.ApprovalStatus;
import com.onboardpro.employee.entity.EmployeeStatus;
import com.onboardpro.employee.entity.OnboardingStatus;
import com.onboardpro.employee.entity.TaskStatus;
import com.onboardpro.employee.repository.ApprovalRepository;
import com.onboardpro.employee.repository.EmployeeRepository;
import com.onboardpro.employee.repository.OnboardingTaskRepository;
import com.onboardpro.employee.service.ReportService;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ReportServiceImpl implements ReportService {

    private final EmployeeRepository employeeRepository;
    private final OnboardingTaskRepository taskRepository;
    private final ApprovalRepository approvalRepository;

    @Override
    @Transactional(readOnly = true)
    public ReportSummaryResponse summary() {
        return new ReportSummaryResponse(
                employeeRepository.count(),
                employeeRepository.findByStatus(EmployeeStatus.ACTIVE).size(),
                employeeRepository.findByOnboardingStatus(OnboardingStatus.COMPLETED).size(),
                taskRepository.findByStatus(TaskStatus.PENDING).size(),
                approvalRepository.findByStatus(ApprovalStatus.PENDING).size()
        );
    }

    @Override
    @Transactional(readOnly = true)
    public ManagerReportResponse managerReport() {
        long pendingTasks = taskRepository.countByStatus(TaskStatus.PENDING);
        return new ManagerReportResponse(
                pendingTasks,
                approvalRepository.countByStatus(ApprovalStatus.APPROVED),
                approvalRepository.countByStatus(ApprovalStatus.REJECTED),
                pendingTasks
        );
    }

    @Override
    @Transactional(readOnly = true)
    public List<Map<String, Object>> onboardingReport() {
        return employeeRepository.findAll().stream()
                .map(employee -> Map.<String, Object>of(
                        "employeeCode", employee.getEmployeeCode(),
                        "name", employee.getFullName(),
                        "email", employee.getEmail(),
                        "department", employee.getDepartment().getName(),
                        "status", employee.getOnboardingStatus(),
                        "progress", employee.getOnboardingProgress()
                ))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<Map<String, Object>> pendingTaskReport() {
        return taskRepository.findByStatus(TaskStatus.PENDING).stream()
                .map(task -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("taskId", task.getId());
                    row.put("employeeCode", task.getEmployee().getEmployeeCode());
                    row.put("title", task.getTitle());
                    row.put("assignedRole", task.getAssignedRole());
                    row.put("dueDate", task.getDueDate());
                    return row;
                })
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<Map<String, Object>> approvalReport() {
        return approvalRepository.findAll().stream()
                .map(approval -> Map.<String, Object>of(
                        "approvalId", approval.getId(),
                        "employeeCode", approval.getEmployee().getEmployeeCode(),
                        "type", approval.getApprovalType(),
                        "status", approval.getStatus(),
                        "approver", approval.getApprover() == null ? "" : approval.getApprover()
                ))
                .toList();
    }
}
