package com.onboardpro.employee.dto;

import java.util.List;

public record DeactivateSystemsRequest(
        List<String> systems
) {
}

