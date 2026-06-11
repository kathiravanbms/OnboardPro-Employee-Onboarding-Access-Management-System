package com.onboardpro.employee.serviceimpl;

import com.onboardpro.employee.dto.ApprovalDecisionRequest;
import com.onboardpro.employee.dto.ApprovalRequest;
import com.onboardpro.employee.dto.ApprovalResponse;
import com.onboardpro.employee.dto.ManagerApprovalRequest;
import com.onboardpro.employee.entity.Approval;
import com.onboardpro.employee.entity.ApprovalStatus;
import com.onboardpro.employee.entity.ApprovalType;
import com.onboardpro.employee.entity.Employee;
import com.onboardpro.employee.entity.Notification;
import com.onboardpro.employee.entity.OnboardingStatus;
import com.onboardpro.employee.exception.BusinessException;
import com.onboardpro.employee.exception.ResourceNotFoundException;
import com.onboardpro.employee.repository.ApprovalRepository;
import com.onboardpro.employee.repository.EmployeeRepository;
import com.onboardpro.employee.repository.NotificationRepository;
import com.onboardpro.employee.service.ApprovalService;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ApprovalServiceImpl implements ApprovalService {

    private static final String HR_INBOX = "hr@onboardpro.local";
    private static final String HR_ROLE = "HR Manager";

    private final ApprovalRepository approvalRepository;
    private final EmployeeRepository employeeRepository;
    private final NotificationRepository notificationRepository;
    private final OnboardingServiceImpl onboardingService;
    private final AuditLogServiceImpl auditLogService;

    @Override
    @Transactional
    public ApprovalResponse createApproval(ApprovalRequest request, String requestedBy) {
        Employee employee = findEmployee(request.employeeId());
        Approval approval = approvalRepository.findByEmployeeIdAndApprovalType(employee.getId(), request.approvalType())
                .orElseGet(() -> Approval.builder()
                        .employee(employee)
                        .approvalType(request.approvalType())
                        .build());
        approval.setStatus(ApprovalStatus.PENDING);
        approval.setRequestedBy(requestedBy);
        approval.setApprover(null);
        approval.setRemarks(request.remarks());
        approval.setDecidedAt(null);
        return ResponseMapper.approval(approvalRepository.save(approval));
    }

    @Override
    @Transactional
    public ApprovalResponse decideApproval(Long id, ApprovalDecisionRequest request, String approver) {
        if (request.status() == ApprovalStatus.PENDING) {
            throw new BusinessException("Approval decision must be APPROVED or REJECTED");
        }
        Approval approval = approvalRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Approval not found"));
        approval.setStatus(request.status());
        approval.setApprover(approver);
        approval.setRemarks(request.remarks());
        approval.setDecidedAt(Instant.now());
        Approval saved = approvalRepository.save(approval);
        if (saved.getStatus() == ApprovalStatus.APPROVED) {
            onboardingService.refreshPersistedProgress(saved.getEmployee());
        }
        return ResponseMapper.approval(saved);
    }

    @Override
    @Transactional
    public ApprovalResponse approveManagerOnboarding(ManagerApprovalRequest request, String approver) {
        return decideManagerOnboarding(request, approver, ApprovalStatus.APPROVED);
    }

    @Override
    @Transactional
    public ApprovalResponse rejectManagerOnboarding(ManagerApprovalRequest request, String approver) {
        return decideManagerOnboarding(request, approver, ApprovalStatus.REJECTED);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ApprovalResponse> listApprovals(Long employeeId, String actorEmail) {
        if (employeeId != null) {
            return approvalRepository.findByEmployeeId(employeeId).stream().map(ResponseMapper::approval).toList();
        }

        Optional<Employee> actorOpt = employeeRepository.findByEmailIgnoreCase(actorEmail);
        if (actorOpt.isEmpty()) {
            // If actor is not an employee (e.g. Admin/HR), return all approvals
            return approvalRepository.findAll().stream().map(ResponseMapper::approval).toList();
        }

        Employee actor = actorOpt.get();
        // Filter by department for managers
        List<Approval> approvals = approvalRepository.findByEmployeeDepartmentId(actor.getDepartment().getId());
        return approvals.stream().map(ResponseMapper::approval).toList();
    }

    private Employee findEmployee(Long id) {
        return employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));
    }

    private ApprovalResponse decideManagerOnboarding(
            ManagerApprovalRequest request,
            String approver,
            ApprovalStatus decision) {
        Employee employee = findEmployee(request.employeeId());
        Approval approval = approvalRepository.findByEmployeeIdAndApprovalType(employee.getId(), ApprovalType.MANAGER_APPROVAL)
                .orElseGet(() -> Approval.builder()
                        .employee(employee)
                        .approvalType(ApprovalType.MANAGER_APPROVAL)
                        .requestedBy(employee.getFullName())
                        .build());

        approval.setRequestedBy(employee.getFullName());
        approval.setStatus(decision);
        approval.setApprover(approver);
        approval.setRemarks(cleanRemarks(request.remarks()));
        approval.setDecidedAt(Instant.now());
        Approval saved = approvalRepository.save(approval);

        employee.setOnboardingStatus(decision == ApprovalStatus.APPROVED
                ? OnboardingStatus.HR_VERIFICATION
                : OnboardingStatus.PENDING_APPROVAL);
        employeeRepository.save(employee);

        String decisionWord = decision == ApprovalStatus.APPROVED ? "approved" : "rejected";
        auditLogService.record(
                approver,
                "Department Manager",
                "Approvals",
                decision == ApprovalStatus.APPROVED ? "Approved" : "Rejected",
                "Manager %s onboarding request for employee %s.".formatted(decisionWord, employee.getEmployeeCode()),
                employee.getId(),
                employee.getFullName()
        );

        if (decision == ApprovalStatus.APPROVED) {
            notifyHr(employee, approver, saved.getRemarks());
        } else {
            notifyRejectedEmployee(employee, approver, saved.getRemarks());
        }

        return ResponseMapper.approval(saved);
    }

    private String cleanRemarks(String remarks) {
        return remarks == null || remarks.isBlank() ? null : remarks.trim();
    }

    private void notifyHr(Employee employee, String approver, String remarks) {
        notificationRepository.save(Notification.builder()
                .employee(employee)
                .recipientEmail(HR_INBOX)
                .recipientRole(HR_ROLE)
                .notificationType("MANAGER_ONBOARDING_APPROVED")
                .title("Manager approved onboarding")
                .message("%s (%s) was approved by %s and is ready for HR verification.%s".formatted(
                        employee.getFullName(),
                        employee.getEmployeeCode(),
                        approver,
                        remarks == null ? "" : " Remarks: " + remarks
                ))
                .readFlag(false)
                .build());
    }

    private void notifyRejectedEmployee(Employee employee, String approver, String remarks) {
        notificationRepository.save(Notification.builder()
                .employee(employee)
                .recipientUserId(employee.getId())
                .recipientEmail(employee.getEmail())
                .recipientRole("Employee")
                .notificationType("MANAGER_ONBOARDING_REJECTED")
                .title("Onboarding approval rejected")
                .message("Your onboarding request was rejected by %s.%s".formatted(
                        approver,
                        remarks == null ? "" : " Remarks: " + remarks
                ))
                .readFlag(false)
                .build());
    }
}
