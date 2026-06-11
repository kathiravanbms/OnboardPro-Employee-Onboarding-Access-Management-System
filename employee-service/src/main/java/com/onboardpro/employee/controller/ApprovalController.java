package com.onboardpro.employee.controller;

import com.onboardpro.employee.dto.ApiResponse;
import com.onboardpro.employee.dto.ApprovalDecisionRequest;
import com.onboardpro.employee.dto.ApprovalRequest;
import com.onboardpro.employee.dto.ApprovalResponse;
import com.onboardpro.employee.dto.ManagerApprovalRequest;
import com.onboardpro.employee.service.ApprovalService;
import jakarta.validation.Valid;
import java.security.Principal;
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
@RequestMapping("/api/approvals")
@RequiredArgsConstructor
public class ApprovalController {

    private final ApprovalService approvalService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER','DEPARTMENT_MANAGER','IT_MANAGER','IT_ADMIN')")
    public ApiResponse<ApprovalResponse> createApproval(@Valid @RequestBody ApprovalRequest request, Principal principal) {
        return ApiResponse.success("Approval created", approvalService.createApproval(request, principal.getName()));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER','DEPARTMENT_MANAGER','IT_MANAGER','IT_ADMIN')")
    public ApiResponse<List<ApprovalResponse>> listApprovals(@RequestParam(required = false) Long employeeId, Principal principal) {
        return ApiResponse.success("Approvals fetched", approvalService.listApprovals(employeeId, principal.getName()));
    }

    @GetMapping("/{employeeId}")
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER','DEPARTMENT_MANAGER','IT_MANAGER','IT_ADMIN')")
    public ApiResponse<List<ApprovalResponse>> getEmployeeApprovals(@PathVariable Long employeeId, Principal principal) {
        return ApiResponse.success("Employee approvals fetched", approvalService.listApprovals(employeeId, principal.getName()));
    }

    @PostMapping("/approve")
    @PreAuthorize("hasRole('DEPARTMENT_MANAGER')")
    public ApiResponse<ApprovalResponse> approveManagerOnboarding(
            @Valid @RequestBody ManagerApprovalRequest request,
            Principal principal) {
        return ApiResponse.success(
                "Manager approval recorded",
                approvalService.approveManagerOnboarding(request, principal.getName())
        );
    }

    @PostMapping("/reject")
    @PreAuthorize("hasRole('DEPARTMENT_MANAGER')")
    public ApiResponse<ApprovalResponse> rejectManagerOnboarding(
            @Valid @RequestBody ManagerApprovalRequest request,
            Principal principal) {
        return ApiResponse.success(
                "Manager rejection recorded",
                approvalService.rejectManagerOnboarding(request, principal.getName())
        );
    }

    @PatchMapping("/{id}/decision")
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER','DEPARTMENT_MANAGER','IT_MANAGER','IT_ADMIN')")
    public ApiResponse<ApprovalResponse> decideApproval(
            @PathVariable Long id,
            @Valid @RequestBody ApprovalDecisionRequest request,
            Principal principal) {
        return ApiResponse.success("Approval decision recorded", approvalService.decideApproval(id, request, principal.getName()));
    }
}


