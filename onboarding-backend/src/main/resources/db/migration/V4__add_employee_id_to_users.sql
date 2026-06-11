ALTER TABLE users
    ADD COLUMN employee_id VARCHAR(20) NULL AFTER id,
    ADD UNIQUE KEY uk_users_employee_id (employee_id);
