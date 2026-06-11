package com.onboardpro.employee.controller;

import com.onboardpro.employee.dto.ApiResponse;
import com.onboardpro.employee.dto.CredentialResponse;
import com.onboardpro.employee.serviceimpl.AccessAssignmentServiceImpl;
import java.security.Principal;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/credentials")
@RequiredArgsConstructor
public class CredentialController {

    private final AccessAssignmentServiceImpl accessAssignmentService;

    @GetMapping
    @PreAuthorize("hasRole('EMPLOYEE')")
    public ApiResponse<List<CredentialResponse>> listCredentials(Principal principal) {
        return ApiResponse.success("Credentials fetched", accessAssignmentService.listEmployeeCredentials(principal.getName()));
    }
}
