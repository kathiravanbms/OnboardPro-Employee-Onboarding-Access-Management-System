package com.onboardpro.employee.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "audit_logs")
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "audit_id")
    private Long auditId;

    @Column(name = "user_id")
    private String userId;

    @Column(name = "user_name", nullable = false, length = 160)
    private String userName;

    @Column(nullable = false, length = 80)
    private String role;

    @Column(nullable = false, length = 80)
    private String module;

    @Column(nullable = false, length = 120)
    private String action;

    @Column(nullable = false, length = 1000)
    private String description;

    @Column(name = "target_employee_id")
    private Long targetEmployeeId;

    @Column(name = "target_employee_name", length = 160)
    private String targetEmployeeName;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant timestamp;
}
