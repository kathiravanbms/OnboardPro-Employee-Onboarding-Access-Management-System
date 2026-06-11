package com.onboardpro.employee.dto;

import java.time.Instant;
import java.time.LocalDate;

public record AccessDeactivationSummaryRow(
        Long id,
        String employeeCode,
        String fullName,
        String departmentName,
        String systems,
        String status,
        Instant deactivatedOn,
        LocalDate exitDate,
        String reason
) {
}
