package com.onboardpro.employee.service;

import com.onboardpro.employee.dto.ApprovalDecisionRequest;
import com.onboardpro.employee.dto.ApprovalRequest;
import com.onboardpro.employee.dto.ApprovalResponse;
import com.onboardpro.employee.dto.ManagerApprovalRequest;
import java.util.List;

public interface ApprovalService {
    ApprovalResponse createApproval(ApprovalRequest request, String requestedBy);
    ApprovalResponse decideApproval(Long id, ApprovalDecisionRequest request, String approver);
    ApprovalResponse approveManagerOnboarding(ManagerApprovalRequest request, String approver);
    ApprovalResponse rejectManagerOnboarding(ManagerApprovalRequest request, String approver);
    List<ApprovalResponse> listApprovals(Long employeeId, String actorEmail);
}
