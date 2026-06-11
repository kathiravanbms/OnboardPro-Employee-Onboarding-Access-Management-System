package com.onboardpro.employee.service;

import com.onboardpro.employee.dto.AccessRequestCreateRequest;
import com.onboardpro.employee.dto.AccessRequestDecisionRequest;
import com.onboardpro.employee.dto.AccessRequestResponse;
import com.onboardpro.employee.dto.SystemCatalogResponse;
import java.util.List;

public interface AccessRequestService {
    AccessRequestResponse requestAccess(AccessRequestCreateRequest request, String requestedBy);
    AccessRequestResponse updateAccessRequest(Long id, AccessRequestDecisionRequest request, String actor);
    List<AccessRequestResponse> listAccessRequests(String employeeId, String employeeEmail);
    List<SystemCatalogResponse> listActiveRequestSystems();
}
