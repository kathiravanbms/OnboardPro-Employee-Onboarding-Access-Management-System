UPDATE users u
JOIN (
    SELECT
        candidate.id,
        ROW_NUMBER() OVER (ORDER BY candidate.created_at, candidate.username, candidate.id) AS sequence_number
    FROM users candidate
    JOIN user_role_mapping urm ON urm.user_id = candidate.id
    JOIN roles r ON r.id = urm.role_id
    WHERE candidate.employee_id IS NULL
      AND r.role_name <> 'ADMIN'
) numbered ON numbered.id = u.id
JOIN (
    SELECT COALESCE(MAX(CAST(SUBSTRING(employee_id, 4) AS UNSIGNED)), 1000) AS current_max
    FROM users
    WHERE employee_id REGEXP '^EMP[0-9]+$'
) existing_ids
SET u.employee_id = CONCAT('EMP', existing_ids.current_max + numbered.sequence_number)
WHERE u.employee_id IS NULL;
