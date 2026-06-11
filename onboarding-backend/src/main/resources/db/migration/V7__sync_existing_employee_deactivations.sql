UPDATE users u
JOIN onboardpro_employee.access_deactivations ad ON LOWER(ad.employee_email) = LOWER(u.email)
SET u.is_active = FALSE
WHERE LOWER(ad.status) IN ('pending', 'approved', 'deactivated');

UPDATE refresh_tokens rt
JOIN users u ON u.id = rt.user_id
JOIN onboardpro_employee.access_deactivations ad ON LOWER(ad.employee_email) = LOWER(u.email)
SET rt.is_revoked = TRUE
WHERE LOWER(ad.status) IN ('pending', 'approved', 'deactivated');
