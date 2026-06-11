package com.onboardpro.employee.repository;

import com.onboardpro.employee.entity.Approval;
import com.onboardpro.employee.entity.ApprovalStatus;
import com.onboardpro.employee.entity.ApprovalType;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ApprovalRepository extends JpaRepository<Approval, Long> {
    List<Approval> findByEmployeeId(Long employeeId);
    List<Approval> findByEmployeeDepartmentId(Long departmentId);
    List<Approval> findByStatus(ApprovalStatus status);
    long countByStatus(ApprovalStatus status);
    long countByEmployeeIdInAndApprovalTypeAndStatus(Collection<Long> employeeIds, ApprovalType approvalType, ApprovalStatus status);
    List<Approval> findByEmployeeIdInAndApprovalTypeOrderByUpdatedAtDesc(Collection<Long> employeeIds, ApprovalType approvalType);
    Optional<Approval> findByEmployeeIdAndApprovalType(Long employeeId, ApprovalType approvalType);
}
