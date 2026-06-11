package com.onboardpro.employee.dto;

import com.onboardpro.employee.entity.ApprovalStatus;
import com.onboardpro.employee.entity.ApprovalType;
import java.time.Instant;

public record ApprovalResponse(
        Long id,
        Long employeeId,
        String employeeCode,
        String employeeName,
        ApprovalType approvalType,
        ApprovalStatus status,
        String requestedBy,
        String approver,
        String remarks,
        Instant decidedAt,
        Instant createdAt,
        Instant updatedAt
) {
}
