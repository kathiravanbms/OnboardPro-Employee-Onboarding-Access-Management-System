SET @demo_password = '$2b$10$S/td9cWnEq.amF0FqDFLZ.rSqu5MxOy9V5ebmAarqc9yFIYv3rw/W';

INSERT INTO users (id, username, email, password, is_active)
VALUES
    (UUID_TO_BIN('00000000-0000-0000-0000-000000000101'), 'employee_demo', 'employee@demo.com', @demo_password, TRUE),
    (UUID_TO_BIN('00000000-0000-0000-0000-000000000102'), 'hr_demo', 'hr@demo.com', @demo_password, TRUE),
    (UUID_TO_BIN('00000000-0000-0000-0000-000000000103'), 'manager_demo', 'manager@demo.com', @demo_password, TRUE),
    (UUID_TO_BIN('00000000-0000-0000-0000-000000000104'), 'it_demo', 'it@demo.com', @demo_password, TRUE),
    (UUID_TO_BIN('00000000-0000-0000-0000-000000000105'), 'admin_demo', 'admin@demo.com', @demo_password, TRUE)
ON DUPLICATE KEY UPDATE
    username = VALUES(username),
    password = VALUES(password),
    is_active = TRUE;

DELETE urm
FROM user_role_mapping urm
JOIN users u ON u.id = urm.user_id
WHERE u.email IN ('employee@demo.com', 'hr@demo.com', 'manager@demo.com', 'it@demo.com', 'admin@demo.com');

INSERT INTO user_role_mapping (user_id, role_id)
SELECT u.id, r.id
FROM users u
JOIN roles r ON (
    (u.email = 'employee@demo.com' AND r.role_name = 'EMPLOYEE')
    OR (u.email = 'hr@demo.com' AND r.role_name = 'HR_MANAGER')
    OR (u.email = 'manager@demo.com' AND r.role_name = 'DEPARTMENT_MANAGER')
    OR (u.email = 'it@demo.com' AND r.role_name = 'IT_ADMIN')
    OR (u.email = 'admin@demo.com' AND r.role_name = 'ADMIN')
)
WHERE u.email IN ('employee@demo.com', 'hr@demo.com', 'manager@demo.com', 'it@demo.com', 'admin@demo.com');
