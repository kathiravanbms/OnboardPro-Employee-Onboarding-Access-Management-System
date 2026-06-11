package com.onboardpro.employee.dto;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

public record AccessDeactivationPageResponse(
        Long id,
        String employeeCode,
        String fullName,
        String departmentName,
        List<String> systems,
        String status,
        Instant deactivatedOn,
        LocalDate exitDate,
        String reason
) {
}
