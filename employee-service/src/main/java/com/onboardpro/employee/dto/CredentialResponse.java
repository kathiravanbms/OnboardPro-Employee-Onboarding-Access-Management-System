package com.onboardpro.employee.dto;

import java.time.LocalDate;

public record CredentialResponse(
        Long systemCatalogId,
        String systemName,
        String username,
        String password,
        LocalDate provisionedOn,
        String status
) {
}
