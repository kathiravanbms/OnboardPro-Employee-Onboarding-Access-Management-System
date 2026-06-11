package com.onboardpro.employee.controller;

import com.onboardpro.employee.dto.ApiResponse;
import com.onboardpro.employee.dto.AuditLogRequest;
import com.onboardpro.employee.dto.AuditLogResponse;
import com.onboardpro.employee.service.AuditLogService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/audit-logs")
@RequiredArgsConstructor
public class AuditLogController {

    private final AuditLogService auditLogService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','IT_MANAGER','IT_ADMIN')")
    public ApiResponse<List<AuditLogResponse>> listAuditLogs(Authentication authentication) {
        return ApiResponse.success("Audit logs fetched", auditLogService.listFor(authentication));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER','DEPARTMENT_MANAGER','IT_MANAGER','IT_ADMIN','EMPLOYEE')")
    public ApiResponse<AuditLogResponse> createAuditLog(@RequestBody AuditLogRequest request) {
        return ApiResponse.success("Audit log recorded", auditLogService.record(request));
    }
}
