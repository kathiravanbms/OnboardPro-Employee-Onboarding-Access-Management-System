package com.onboardpro.authidentity.repository;

import com.onboardpro.authidentity.domain.PlatformSetting;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PlatformSettingRepository extends JpaRepository<PlatformSetting, String> {
}
