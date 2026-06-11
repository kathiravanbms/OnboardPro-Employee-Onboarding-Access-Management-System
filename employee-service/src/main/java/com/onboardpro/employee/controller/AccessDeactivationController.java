package com.onboardpro.employee.controller;

import com.onboardpro.employee.dto.AccessDeactivationRequest;
import com.onboardpro.employee.dto.AccessDeactivationPageResponse;
import com.onboardpro.employee.dto.AccessDeactivationResponse;
import com.onboardpro.employee.dto.ApiResponse;
import com.onboardpro.employee.dto.AssignedSystemResponse;
import com.onboardpro.employee.dto.DeactivateSystemsRequest;
import com.onboardpro.employee.serviceimpl.AccessAssignmentServiceImpl;
import com.onboardpro.employee.serviceimpl.AccessDeactivationServiceImpl;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/access-deactivations")
@RequiredArgsConstructor
public class AccessDeactivationController {

    private final AccessDeactivationServiceImpl accessDeactivationService;
    private final AccessAssignmentServiceImpl accessAssignmentService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','IT_MANAGER','IT_ADMIN')")
    public ApiResponse<List<AccessDeactivationResponse>> listDeactivations(@RequestParam(required = false) String status) {
        return ApiResponse.success("Access deactivations fetched", accessDeactivationService.listDeactivations(status));
    }

    @GetMapping("/active")
    @PreAuthorize("hasAnyRole('ADMIN','IT_MANAGER','IT_ADMIN')")
    public ApiResponse<List<AccessDeactivationPageResponse>> listActiveDeactivationCandidates() {
        return ApiResponse.success("Active deactivation candidates fetched", accessDeactivationService.listActiveDeactivationCandidates());
    }

    @GetMapping("/deactivated")
    @PreAuthorize("hasAnyRole('ADMIN','IT_MANAGER','IT_ADMIN')")
    public ApiResponse<List<AccessDeactivationPageResponse>> listDeactivatedEmployees() {
        return ApiResponse.success("Deactivated employees fetched", accessDeactivationService.listDeactivatedEmployees());
    }

    @GetMapping("/employees/{employeeId}/systems")
    @PreAuthorize("hasAnyRole('ADMIN','IT_MANAGER','IT_ADMIN')")
    public ApiResponse<List<AssignedSystemResponse>> listEmployeeSystems(@PathVariable Long employeeId) {
        return ApiResponse.success("Employee assigned systems fetched", accessAssignmentService.listEmployeeSystems(employeeId));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','IT_MANAGER','IT_ADMIN')")
    public ApiResponse<AccessDeactivationResponse> createDeactivation(@Valid @RequestBody AccessDeactivationRequest request) {
        return ApiResponse.success("Access deactivation created", accessDeactivationService.createDeactivation(request));
    }

    @PatchMapping("/{id}/systems/deactivate")
    @PreAuthorize("hasAnyRole('ADMIN','IT_MANAGER','IT_ADMIN')")
    public ApiResponse<AccessDeactivationResponse> deactivateSystems(@PathVariable Long id, @RequestBody DeactivateSystemsRequest request) {
        return ApiResponse.success("Access systems deactivated", accessDeactivationService.deactivateSystems(id, request));
    }

    @PatchMapping("/{id}/complete")
    @PreAuthorize("hasAnyRole('ADMIN','IT_MANAGER','IT_ADMIN')")
    public ApiResponse<AccessDeactivationResponse> completeDeactivation(@PathVariable Long id) {
        return ApiResponse.success("Access deactivation completed", accessDeactivationService.completeDeactivation(id));
    }
}
