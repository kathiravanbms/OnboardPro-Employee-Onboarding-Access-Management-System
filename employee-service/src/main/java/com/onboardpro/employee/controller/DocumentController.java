package com.onboardpro.employee.controller;

import com.onboardpro.employee.dto.ApiResponse;
import com.onboardpro.employee.dto.DocumentRequest;
import com.onboardpro.employee.dto.DocumentResponse;
import com.onboardpro.employee.dto.DocumentVerificationRequest;
import com.onboardpro.employee.service.DocumentService;
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
@RequestMapping("/api/documents")
@RequiredArgsConstructor
public class DocumentController {

    private final DocumentService documentService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER','EMPLOYEE')")
    public ApiResponse<DocumentResponse> uploadDocument(@Valid @RequestBody DocumentRequest request) {
        return ApiResponse.success("Document metadata stored", documentService.uploadDocument(request));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER','DEPARTMENT_MANAGER','IT_MANAGER','IT_ADMIN','EMPLOYEE')")
    public ApiResponse<List<DocumentResponse>> listDocuments(@RequestParam(required = false) Long employeeId) {
        return ApiResponse.success("Documents fetched", documentService.listDocuments(employeeId));
    }

    @PatchMapping("/{id}/verify")
    @PreAuthorize("hasAnyRole('ADMIN','HR_MANAGER')")
    public ApiResponse<DocumentResponse> verifyDocument(
            @PathVariable Long id,
            @Valid @RequestBody DocumentVerificationRequest request,
            Principal principal) {
        return ApiResponse.success("Document reviewed", documentService.verifyDocument(id, request, principal.getName()));
    }

    @PatchMapping("/{id}/re-review")
    @PreAuthorize("hasRole('HR_MANAGER')")
    public ApiResponse<DocumentResponse> reReviewDocument(
            @PathVariable Long id,
            @Valid @RequestBody DocumentVerificationRequest request,
            Principal principal) {
        return ApiResponse.success("Document re-reviewed", documentService.reReviewDocument(id, request, principal.getName()));
    }
}
