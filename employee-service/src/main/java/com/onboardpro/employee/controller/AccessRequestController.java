package com.onboardpro.employee.controller;

import com.onboardpro.employee.dto.AccessRequestCreateRequest;
import com.onboardpro.employee.dto.AccessRequestDecisionRequest;
import com.onboardpro.employee.dto.AccessRequestResponse;
import com.onboardpro.employee.dto.ApiResponse;
import com.onboardpro.employee.dto.SystemCatalogResponse;
import com.onboardpro.employee.service.AccessRequestService;
import jakarta.validation.Valid;
import java.security.Principal;
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
@RequestMapping("/api/access-requests")
@RequiredArgsConstructor
public class AccessRequestController {

    private final AccessRequestService accessRequestService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER','DEPARTMENT_MANAGER','IT_MANAGER','IT_ADMIN','EMPLOYEE')")
    public ApiResponse<AccessRequestResponse> requestAccess(@Valid @RequestBody AccessRequestCreateRequest request, Principal principal) {
        return ApiResponse.success("Access request created", accessRequestService.requestAccess(request, principal.getName()));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER','DEPARTMENT_MANAGER','IT_MANAGER','IT_ADMIN','EMPLOYEE')")
    public ApiResponse<List<AccessRequestResponse>> listAccessRequests(
            @RequestParam(required = false) String employeeId,
            Principal principal) {
        return ApiResponse.success("Access requests fetched", accessRequestService.listAccessRequests(employeeId, principal.getName()));
    }

    @GetMapping("/active")
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER','DEPARTMENT_MANAGER','IT_MANAGER','IT_ADMIN','EMPLOYEE')")
    public ApiResponse<List<SystemCatalogResponse>> listActiveAccessRequestsData() {
        return ApiResponse.success("Active systems fetched", accessRequestService.listActiveRequestSystems());
    }

    @GetMapping("/systems/active")
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER','DEPARTMENT_MANAGER','IT_MANAGER','IT_ADMIN','EMPLOYEE')")
    public ApiResponse<List<SystemCatalogResponse>> listActiveRequestSystems() {
        return ApiResponse.success("Active systems fetched", accessRequestService.listActiveRequestSystems());
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN','DEPARTMENT_MANAGER','IT_MANAGER','IT_ADMIN')")
    public ApiResponse<AccessRequestResponse> updateAccessRequest(
            @PathVariable Long id,
            @Valid @RequestBody AccessRequestDecisionRequest request,
            Principal principal) {
        return ApiResponse.success("Access request updated", accessRequestService.updateAccessRequest(id, request, principal.getName()));
    }
}
