package com.onboardpro.employee.service;

import com.onboardpro.employee.dto.AuditLogRequest;
import com.onboardpro.employee.dto.AuditLogResponse;
import java.util.List;
import org.springframework.security.core.Authentication;

public interface AuditLogService {
    AuditLogResponse record(AuditLogRequest request);
    AuditLogResponse record(String userName, String role, String module, String action, String description, Long targetEmployeeId, String targetEmployeeName);
    List<AuditLogResponse> listFor(Authentication authentication);
}
