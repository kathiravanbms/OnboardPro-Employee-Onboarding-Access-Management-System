CREATE TABLE platform_settings (
    setting_key VARCHAR(80) NOT NULL,
    setting_value BOOLEAN NOT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (setting_key)
);

INSERT INTO platform_settings (setting_key, setting_value) VALUES
    ('EMAIL_NOTIFICATIONS', TRUE),
    ('AUTO_ASSIGN_EMPLOYEE_IDS', TRUE);
