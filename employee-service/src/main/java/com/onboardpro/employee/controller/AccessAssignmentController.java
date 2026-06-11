package com.onboardpro.employee.controller;

import com.onboardpro.employee.dto.AccessAssignmentDetailsResponse;
import com.onboardpro.employee.dto.AccessAssignmentListResponse;
import com.onboardpro.employee.dto.AccessAssignmentRequest;
import com.onboardpro.employee.dto.AccessAssignmentResponse;
import com.onboardpro.employee.dto.ApiResponse;
import com.onboardpro.employee.serviceimpl.AccessAssignmentServiceImpl;
import java.security.Principal;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/access-assignments")
@RequiredArgsConstructor
public class AccessAssignmentController {

    private final AccessAssignmentServiceImpl accessAssignmentService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','IT_MANAGER','IT_ADMIN')")
    public ApiResponse<List<AccessAssignmentListResponse>> listAssignments(@RequestParam(required = false) String status) {
        return ApiResponse.success("Access assignments fetched", accessAssignmentService.listAssignments(status));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','IT_MANAGER','IT_ADMIN')")
    public ApiResponse<AccessAssignmentDetailsResponse> getAssignmentDetails(@PathVariable Long id) {
        return ApiResponse.success("Access assignment details fetched", accessAssignmentService.getAssignmentDetails(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','IT_MANAGER','IT_ADMIN')")
    public ApiResponse<AccessAssignmentResponse> createAssignment(@RequestBody AccessAssignmentRequest request) {
        return ApiResponse.success("Access assignment created", accessAssignmentService.createAssignment(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','IT_MANAGER','IT_ADMIN')")
    public ApiResponse<AccessAssignmentResponse> updateAssignment(
            @PathVariable Long id,
            @RequestBody AccessAssignmentRequest request,
            Principal principal) {
        return ApiResponse.success("Access assignment updated", accessAssignmentService.updateAssignment(id, request, principal.getName()));
    }

    @PatchMapping("/{id}/revoke")
    @PreAuthorize("hasAnyRole('ADMIN','IT_MANAGER','IT_ADMIN')")
    public ApiResponse<AccessAssignmentResponse> revokeAssignment(@PathVariable Long id) {
        return ApiResponse.success("Access assignment revoked", accessAssignmentService.revokeAssignment(id));
    }
}
