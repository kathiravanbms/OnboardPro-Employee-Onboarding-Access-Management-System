package com.onboardpro.employee.service;

import com.onboardpro.employee.dto.HrDocumentVerificationReportRowDTO;
import com.onboardpro.employee.dto.HrOnboardingCompletionReportRowDTO;
import com.onboardpro.employee.dto.HrPendingTaskReportRowDTO;
import java.util.List;

public interface HrReportService {
    List<HrOnboardingCompletionReportRowDTO> onboardingCompletionReport();
    List<HrDocumentVerificationReportRowDTO> documentVerificationReport();
    List<HrPendingTaskReportRowDTO> pendingTaskReport();
}
