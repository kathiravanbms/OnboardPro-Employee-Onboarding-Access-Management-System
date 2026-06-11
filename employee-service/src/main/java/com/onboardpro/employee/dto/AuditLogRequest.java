package com.onboardpro.employee.dto;

public record AuditLogRequest(
        String userId,
        String userName,
        String role,
        String module,
        String action,
        String description,
        Long targetEmployeeId,
        String targetEmployeeName
) {}
