package com.onboardpro.employee.repository;

import com.onboardpro.employee.entity.AuditLog;
import java.util.Collection;
import java.time.Instant;
import java.util.List;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    List<AuditLog> findAllByOrderByTimestampDesc();

    List<AuditLog> findByModuleInOrderByTimestampDesc(List<String> modules);

    List<AuditLog> findByModuleInOrderByTimestampDesc(Collection<String> modules, Pageable pageable);

    List<AuditLog> findByTargetEmployeeIdInAndModuleInOrderByTimestampDesc(Collection<Long> targetEmployeeIds, Collection<String> modules, Pageable pageable);

    @Query("""
            select count(log) > 0
            from AuditLog log
            where lower(log.userName) = lower(:userName)
              and lower(log.role) = lower(:role)
              and lower(log.module) = lower(:module)
              and lower(log.action) = lower(:action)
              and log.description = :description
              and ((:targetEmployeeId is null and log.targetEmployeeId is null) or log.targetEmployeeId = :targetEmployeeId)
              and log.timestamp >= :since
            """)
    boolean existsDuplicateSince(
            @Param("userName") String userName,
            @Param("role") String role,
            @Param("module") String module,
            @Param("action") String action,
            @Param("description") String description,
            @Param("targetEmployeeId") Long targetEmployeeId,
            @Param("since") Instant since);
}
