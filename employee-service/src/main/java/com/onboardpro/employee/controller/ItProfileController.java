package com.onboardpro.employee.controller;

import com.onboardpro.employee.dto.ApiResponse;
import com.onboardpro.employee.dto.ItProfileResponse;
import com.onboardpro.employee.dto.ItProfileUpdateRequest;
import com.onboardpro.employee.serviceimpl.ItProfileServiceImpl;
import jakarta.validation.Valid;
import java.security.Principal;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/it/profile")
@RequiredArgsConstructor
public class ItProfileController {

    private final ItProfileServiceImpl itProfileService;

    @GetMapping
    @PreAuthorize("hasAnyRole('IT_MANAGER','IT_ADMIN')")
    public ApiResponse<ItProfileResponse> getProfile(Principal principal) {
        return ApiResponse.success("IT Manager profile fetched", itProfileService.getCurrentProfile(principal.getName()));
    }

    @PutMapping
    @PreAuthorize("hasAnyRole('IT_MANAGER','IT_ADMIN')")
    public ApiResponse<ItProfileResponse> updateProfile(
            Principal principal,
            @Valid @RequestBody ItProfileUpdateRequest request) {
        return ApiResponse.success("IT Manager profile updated", itProfileService.updateCurrentProfile(principal.getName(), request));
    }
}
