package com.onboardpro.employee.dto;

public record PolicyAcknowledgmentRequest(
        boolean conduct,
        boolean workingHours,
        boolean antiHarassment,
        boolean dataSecurity,
        boolean healthSafety
) {
}
