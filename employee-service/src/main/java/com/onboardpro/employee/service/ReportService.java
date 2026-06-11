package com.onboardpro.employee.service;

import com.onboardpro.employee.dto.ReportSummaryResponse;
import com.onboardpro.employee.dto.ManagerReportResponse;
import java.util.List;
import java.util.Map;

public interface ReportService {
    ReportSummaryResponse summary();
    ManagerReportResponse managerReport();
    List<Map<String, Object>> onboardingReport();
    List<Map<String, Object>> pendingTaskReport();
    List<Map<String, Object>> approvalReport();
}
