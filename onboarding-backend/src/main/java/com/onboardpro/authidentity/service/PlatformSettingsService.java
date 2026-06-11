package com.onboardpro.authidentity.service;

import com.onboardpro.authidentity.domain.PlatformSetting;
import com.onboardpro.authidentity.dto.PlatformSettingsRequest;
import com.onboardpro.authidentity.dto.PlatformSettingsResponse;
import com.onboardpro.authidentity.repository.PlatformSettingRepository;
import java.time.Instant;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PlatformSettingsService {

    private static final String EMAIL_NOTIFICATIONS = "EMAIL_NOTIFICATIONS";
    private static final String AUTO_ASSIGN_EMPLOYEE_IDS = "AUTO_ASSIGN_EMPLOYEE_IDS";

    private final PlatformSettingRepository platformSettingRepository;

    @Transactional(readOnly = true)
    public PlatformSettingsResponse getSettings() {
        return PlatformSettingsResponse.builder()
                .emailNotifications(isEmailNotificationsEnabled())
                .autoAssignEmployeeIds(isAutoAssignEmployeeIdsEnabled())
                .build();
    }

    @Transactional
    public PlatformSettingsResponse updateSettings(PlatformSettingsRequest request) {
        if (request.getEmailNotifications() != null) {
            saveSetting(EMAIL_NOTIFICATIONS, request.getEmailNotifications());
        }
        if (request.getAutoAssignEmployeeIds() != null) {
            saveSetting(AUTO_ASSIGN_EMPLOYEE_IDS, request.getAutoAssignEmployeeIds());
        }
        return getSettings();
    }

    @Transactional(readOnly = true)
    public boolean isEmailNotificationsEnabled() {
        return getBooleanSetting(EMAIL_NOTIFICATIONS, true);
    }

    @Transactional(readOnly = true)
    public boolean isAutoAssignEmployeeIdsEnabled() {
        return getBooleanSetting(AUTO_ASSIGN_EMPLOYEE_IDS, true);
    }

    private boolean getBooleanSetting(String key, boolean defaultValue) {
        return platformSettingRepository.findById(key)
                .map(PlatformSetting::getSettingValue)
                .orElse(defaultValue);
    }

    private void saveSetting(String key, boolean value) {
        PlatformSetting setting = platformSettingRepository.findById(key)
                .orElseGet(() -> PlatformSetting.builder()
                        .settingKey(key)
                        .updatedAt(Instant.now())
                        .build());
        setting.setSettingValue(value);
        platformSettingRepository.save(setting);
    }
}
