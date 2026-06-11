package com.onboardpro.employee.controller;

import com.onboardpro.employee.dto.ApiResponse;
import com.onboardpro.employee.dto.SystemCatalogDecisionRequest;
import com.onboardpro.employee.dto.SystemCatalogRequest;
import com.onboardpro.employee.dto.SystemCatalogActiveUserResponse;
import com.onboardpro.employee.dto.SystemCatalogActiveUserSummaryResponse;
import com.onboardpro.employee.dto.SystemCatalogResponse;
import com.onboardpro.employee.serviceimpl.SystemCatalogServiceImpl;
import jakarta.validation.Valid;
import java.security.Principal;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/system-catalog")
@RequiredArgsConstructor
public class SystemCatalogController {

    private final SystemCatalogServiceImpl systemCatalogService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','IT_MANAGER','IT_ADMIN')")
    public ApiResponse<List<SystemCatalogResponse>> listSystems(@RequestParam(required = false, name = "q") String query) {
        return ApiResponse.success("System catalog fetched", systemCatalogService.listSystems(query));
    }

    @GetMapping("/{id}/active-users")
    @PreAuthorize("hasAnyRole('ADMIN','IT_MANAGER','IT_ADMIN')")
    public ApiResponse<List<SystemCatalogActiveUserResponse>> listActiveUsers(@PathVariable Long id) {
        return ApiResponse.success("System active users fetched", systemCatalogService.listActiveUsers(id));
    }

    @GetMapping("/active-users-summary")
    @PreAuthorize("hasAnyRole('ADMIN','IT_MANAGER','IT_ADMIN')")
    public List<SystemCatalogActiveUserSummaryResponse> listActiveUsersSummary() {
        return systemCatalogService.listActiveUsersSummary();
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('IT_MANAGER','IT_ADMIN')")
    public ApiResponse<SystemCatalogResponse> createSystem(@Valid @RequestBody SystemCatalogRequest request, Principal principal) {
        return ApiResponse.success("System catalog item submitted", systemCatalogService.createSystem(request, principal.getName()));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('IT_MANAGER','IT_ADMIN')")
    public ApiResponse<SystemCatalogResponse> updateSystem(@PathVariable Long id, @RequestBody SystemCatalogRequest request) {
        return ApiResponse.success("System catalog item updated", systemCatalogService.updateSystem(id, request));
    }

    @PatchMapping("/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<SystemCatalogResponse> approveSystem(@PathVariable Long id, Principal principal) {
        return ApiResponse.success("System catalog approved", systemCatalogService.approveSystem(id, principal.getName()));
    }

    @PatchMapping("/{id}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<SystemCatalogResponse> rejectSystem(@PathVariable Long id, @RequestBody SystemCatalogDecisionRequest request, Principal principal) {
        return ApiResponse.success("System catalog rejected", systemCatalogService.rejectSystem(id, request.reason(), principal.getName()));
    }

    @PatchMapping("/{id}/withdraw")
    @PreAuthorize("hasAnyRole('IT_MANAGER','IT_ADMIN')")
    public ApiResponse<SystemCatalogResponse> withdrawSystem(@PathVariable Long id, Principal principal) {
        return ApiResponse.success("System catalog request withdrawn", systemCatalogService.withdrawSystem(id, principal.getName()));
    }
}
