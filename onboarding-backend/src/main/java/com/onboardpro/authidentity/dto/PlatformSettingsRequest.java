package com.onboardpro.authidentity.dto;

import lombok.Data;

@Data
public class PlatformSettingsRequest {

    private Boolean emailNotifications;
    private Boolean autoAssignEmployeeIds;
}
