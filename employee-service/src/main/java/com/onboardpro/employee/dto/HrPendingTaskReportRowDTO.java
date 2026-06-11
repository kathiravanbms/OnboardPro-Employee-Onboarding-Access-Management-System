package com.onboardpro.employee.dto;

import com.onboardpro.employee.entity.RoleName;
import com.onboardpro.employee.entity.TaskStatus;
import java.time.Instant;
import java.time.LocalDate;

public record HrPendingTaskReportRowDTO(
        Long taskId,
        String employeeCode,
        String employeeName,
        String department,
        String title,
        RoleName assignedRole,
        TaskStatus status,
        LocalDate dueDate,
        Instant createdAt
) {
}
