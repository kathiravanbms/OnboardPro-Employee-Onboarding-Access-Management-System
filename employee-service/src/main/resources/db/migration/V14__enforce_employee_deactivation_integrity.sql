UPDATE access_deactivations ad
JOIN employees e ON LOWER(e.email) = LOWER(ad.employee_email)
SET ad.employee_id = e.id,
    ad.employee_code = e.employee_code,
    ad.employee_name = e.full_name,
    ad.department = (
      SELECT d.name
      FROM departments d
      WHERE d.id = e.department_id
    )
WHERE ad.employee_id IS NULL;

UPDATE access_deactivations ad
JOIN employees e ON ad.employee_id = e.id
SET ad.employee_code = COALESCE(NULLIF(ad.employee_code, ''), e.employee_code),
    ad.employee_name = COALESCE(NULLIF(ad.employee_name, ''), e.full_name),
    ad.employee_email = COALESCE(NULLIF(ad.employee_email, ''), e.email),
    ad.department = (
      SELECT d.name
      FROM departments d
      WHERE d.id = e.department_id
    );

SET @has_deactivated_at = (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'access_deactivations'
    AND column_name = 'deactivated_at'
);
SET @add_deactivated_at_sql = IF(
  @has_deactivated_at = 0,
  'ALTER TABLE access_deactivations ADD COLUMN deactivated_at TIMESTAMP(6) NULL AFTER status',
  'SELECT 1'
);
PREPARE add_deactivated_at_stmt FROM @add_deactivated_at_sql;
EXECUTE add_deactivated_at_stmt;
DEALLOCATE PREPARE add_deactivated_at_stmt;

UPDATE access_deactivations
SET deactivated_at = COALESCE(
  TIMESTAMP(deactivated_on),
  CASE
    WHEN LOWER(status) IN ('approved', 'completed', 'deactivated') THEN updated_at
    ELSE NULL
  END
);

ALTER TABLE access_deactivations
  MODIFY employee_id BIGINT NOT NULL,
  MODIFY employee_code VARCHAR(40) NOT NULL;

UPDATE access_deactivations duplicate_row
JOIN access_deactivations keeper
  ON keeper.employee_id = duplicate_row.employee_id
 AND keeper.id > duplicate_row.id
 AND LOWER(keeper.status) IN ('pending', 'approved', 'deactivated')
SET duplicate_row.status = 'Superseded'
WHERE LOWER(duplicate_row.status) IN ('pending', 'approved', 'deactivated');

CREATE UNIQUE INDEX uk_access_deactivations_employee_open
  ON access_deactivations (
    employee_id,
    (CASE WHEN LOWER(status) IN ('pending', 'approved', 'deactivated') THEN 1 ELSE NULL END)
  );

UPDATE employees
SET status = 'ACTIVE'
WHERE status IS NULL OR status = '';
