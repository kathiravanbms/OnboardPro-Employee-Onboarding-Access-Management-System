package com.onboardpro.employee.repository;

import com.onboardpro.employee.entity.AccessRequest;
import com.onboardpro.employee.entity.AccessRequestStatus;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AccessRequestRepository extends JpaRepository<AccessRequest, Long> {
    List<AccessRequest> findByEmployeeId(Long employeeId);
    List<AccessRequest> findByEmployeeIdInOrderByUpdatedAtDesc(Collection<Long> employeeIds);
    List<AccessRequest> findByEmployeeDepartmentId(Long departmentId);
    long countByEmployeeId(Long employeeId);
    List<AccessRequest> findByStatus(AccessRequestStatus status);
    long countByEmployeeIdAndStatusIn(Long employeeId, Collection<AccessRequestStatus> statuses);
    Optional<AccessRequest> findFirstByEmployeeIdAndSystemNameIgnoreCaseAndStatusOrderByCreatedAtDesc(
            Long employeeId,
            String systemName,
            AccessRequestStatus status
    );
}
