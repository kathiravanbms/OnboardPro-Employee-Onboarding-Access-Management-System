package com.onboardpro.employee.controller;

import com.onboardpro.employee.dto.ApiResponse;
import com.onboardpro.employee.dto.EmployeeProfileResponse;
import com.onboardpro.employee.dto.EmployeeProfileUpdateRequest;
import com.onboardpro.employee.serviceimpl.EmployeeProfileServiceImpl;
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
@RequestMapping("/api/employee/profile")
@RequiredArgsConstructor
public class EmployeeProfileController {

    private final EmployeeProfileServiceImpl employeeProfileService;

    @GetMapping
    @PreAuthorize("hasRole('EMPLOYEE')")
    public ApiResponse<EmployeeProfileResponse> getProfile(Principal principal) {
        return ApiResponse.success("Employee profile fetched", employeeProfileService.getCurrentProfile(principal.getName()));
    }

    @PutMapping
    @PreAuthorize("hasRole('EMPLOYEE')")
    public ApiResponse<EmployeeProfileResponse> updateProfile(
            Principal principal,
            @Valid @RequestBody EmployeeProfileUpdateRequest request) {
        return ApiResponse.success("Employee profile updated", employeeProfileService.updateCurrentProfile(principal.getName(), request));
    }
}
