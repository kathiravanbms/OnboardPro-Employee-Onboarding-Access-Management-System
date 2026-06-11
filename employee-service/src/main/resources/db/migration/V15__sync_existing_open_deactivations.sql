UPDATE access_deactivations
SET deactivated_at = COALESCE(deactivated_at, updated_at, created_at, CURRENT_TIMESTAMP(6))
WHERE LOWER(status) IN ('pending', 'approved', 'deactivated');

UPDATE employees e
JOIN access_deactivations ad ON ad.employee_id = e.id
SET e.status = 'INACTIVE'
WHERE LOWER(ad.status) IN ('pending', 'approved', 'deactivated');
