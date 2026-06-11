package com.onboardpro.employee.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;
import java.time.LocalDate;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "employees")
public class Employee {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 40)
    private String employeeCode;

    @Column(nullable = false, length = 120)
    private String fullName;

    @Column(nullable = false, unique = true, length = 160)
    private String email;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id", nullable = false)
    private Department department;

    @Column(nullable = false, length = 120)
    private String jobTitle;

    @Column(length = 120)
    private String managerName;

    @Column(nullable = false)
    private LocalDate startDate;

    @Column(length = 40)
    private String phoneNumber;

    private LocalDate dateOfBirth;

    @Column(length = 32)
    private String gender;

    @Column(length = 1000)
    private String address;

    @Column(length = 120)
    private String emergencyContactName;

    @Column(length = 40)
    private String emergencyContactPhone;

    @Column(nullable = false)
    private boolean policyConductAcknowledged;

    @Column(nullable = false)
    private boolean policyWorkingHoursAcknowledged;

    @Column(nullable = false)
    private boolean policyAntiHarassmentAcknowledged;

    @Column(nullable = false)
    private boolean policyDataSecurityAcknowledged;

    @Column(nullable = false)
    private boolean policyHealthSafetyAcknowledged;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private EmployeeStatus status;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private OnboardingStatus onboardingStatus;

    @Column(nullable = false)
    private int onboardingProgress;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private Instant updatedAt;
}
