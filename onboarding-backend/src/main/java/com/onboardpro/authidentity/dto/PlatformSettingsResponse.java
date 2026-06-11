package com.onboardpro.authidentity.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlatformSettingsResponse {

    private Boolean emailNotifications;
    private Boolean autoAssignEmployeeIds;
}
