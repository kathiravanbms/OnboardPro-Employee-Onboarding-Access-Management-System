UPDATE access_deactivations older
JOIN (
  SELECT employee_id, MAX(id) AS latest_id
  FROM access_deactivations
  GROUP BY employee_id
) latest ON latest.employee_id = older.employee_id
JOIN employees e ON e.id = older.employee_id
SET older.status = 'Superseded'
WHERE e.status = 'INACTIVE'
  AND older.id <> latest.latest_id
  AND LOWER(older.status) IN ('pending', 'approved', 'deactivated');

UPDATE access_deactivations latest_row
JOIN (
  SELECT employee_id, MAX(id) AS latest_id
  FROM access_deactivations
  GROUP BY employee_id
) latest ON latest.latest_id = latest_row.id
JOIN employees e ON e.id = latest_row.employee_id
SET latest_row.status = 'Deactivated',
    latest_row.deactivated_at = COALESCE(latest_row.deactivated_at, CURRENT_TIMESTAMP(6)),
    latest_row.employee_code = e.employee_code,
    latest_row.employee_name = e.full_name,
    latest_row.employee_email = e.email,
    latest_row.department = (
      SELECT d.name
      FROM departments d
      WHERE d.id = e.department_id
    )
WHERE e.status = 'INACTIVE';
