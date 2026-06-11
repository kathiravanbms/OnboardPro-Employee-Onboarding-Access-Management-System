package com.onboardpro.employee.dto;

import java.time.Instant;

public record AuditLogResponse(
        Long auditId,
        String userId,
        String userName,
        String role,
        String module,
        String action,
        String description,
        Long targetEmployeeId,
        String targetEmployeeName,
        Instant timestamp
) {}
