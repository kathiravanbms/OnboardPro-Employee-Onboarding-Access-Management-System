package com.onboardpro.employee.dto;

import java.time.LocalDate;

public record ManagerTeamOnboardingResponse(
        Long id,
        Long databaseId,
        String employeeId,
        String name,
        String email,
        String department,
        String departmentName,
        String jobTitle,
        LocalDate startDate,
        String status,
        String docsStatus,
        String accessStatus,
        int progress
) {
}
