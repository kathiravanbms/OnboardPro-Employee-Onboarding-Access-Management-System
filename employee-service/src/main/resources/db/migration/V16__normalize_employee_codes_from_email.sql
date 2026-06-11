UPDATE employees e
LEFT JOIN employees duplicate
  ON duplicate.id <> e.id
 AND LOWER(duplicate.employee_code) = LOWER(SUBSTRING_INDEX(e.email, '@', 1))
SET e.employee_code = SUBSTRING_INDEX(e.email, '@', 1)
WHERE e.employee_code LIKE 'EMP%'
  AND duplicate.id IS NULL
  AND SUBSTRING_INDEX(e.email, '@', 1) <> '';

UPDATE access_deactivations ad
JOIN employees e ON e.id = ad.employee_id
SET ad.employee_code = e.employee_code;
