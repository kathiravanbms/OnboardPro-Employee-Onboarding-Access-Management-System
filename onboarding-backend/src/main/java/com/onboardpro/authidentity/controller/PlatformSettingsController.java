package com.onboardpro.authidentity.controller;

import com.onboardpro.authidentity.dto.ApiResponse;
import com.onboardpro.authidentity.dto.PlatformSettingsRequest;
import com.onboardpro.authidentity.dto.PlatformSettingsResponse;
import com.onboardpro.authidentity.service.PlatformSettingsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Platform Settings", description = "Administrative platform configuration APIs")
@RestController
@RequestMapping("/api/platform-settings")
@RequiredArgsConstructor
public class PlatformSettingsController {

    private final PlatformSettingsService platformSettingsService;

    @Operation(summary = "Get platform settings")
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<PlatformSettingsResponse>> getSettings() {
        return ResponseEntity.ok(ApiResponse.success("Platform settings fetched", platformSettingsService.getSettings()));
    }

    @Operation(summary = "Update platform settings")
    @PutMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<PlatformSettingsResponse>> updateSettings(@RequestBody PlatformSettingsRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Platform settings updated", platformSettingsService.updateSettings(request)));
    }
}
