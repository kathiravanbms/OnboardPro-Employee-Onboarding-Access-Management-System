package com.onboardpro.employee.service;

import com.onboardpro.employee.dto.DocumentRequest;
import com.onboardpro.employee.dto.DocumentResponse;
import com.onboardpro.employee.dto.DocumentVerificationRequest;
import java.util.List;

public interface DocumentService {
    DocumentResponse uploadDocument(DocumentRequest request);
    DocumentResponse verifyDocument(Long id, DocumentVerificationRequest request, String reviewer);
    DocumentResponse reReviewDocument(Long id, DocumentVerificationRequest request, String reviewer);
    List<DocumentResponse> listDocuments(Long employeeId);
}
