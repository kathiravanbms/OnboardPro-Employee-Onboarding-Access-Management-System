CREATE TABLE IF NOT EXISTS audit_logs (
    audit_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NULL,
    user_name VARCHAR(160) NOT NULL,
    role VARCHAR(80) NOT NULL,
    module VARCHAR(80) NOT NULL,
    action VARCHAR(120) NOT NULL,
    description VARCHAR(1000) NOT NULL,
    target_employee_id BIGINT NULL,
    target_employee_name VARCHAR(160) NULL,
    timestamp TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    INDEX idx_audit_logs_timestamp (timestamp),
    INDEX idx_audit_logs_role_timestamp (role, timestamp),
    INDEX idx_audit_logs_module_timestamp (module, timestamp),
    INDEX idx_audit_logs_target_employee (target_employee_id)
);
