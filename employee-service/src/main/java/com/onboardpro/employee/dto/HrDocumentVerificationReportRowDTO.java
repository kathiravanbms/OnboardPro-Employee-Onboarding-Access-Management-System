package com.onboardpro.employee.dto;

import com.onboardpro.employee.entity.DocumentStatus;
import java.time.Instant;

public record HrDocumentVerificationReportRowDTO(
        Long documentId,
        String employeeCode,
        String employeeName,
        String department,
        String documentType,
        String fileName,
        DocumentStatus status,
        String reviewedBy,
        Instant reviewedAt,
        Instant uploadedAt
) {
}
