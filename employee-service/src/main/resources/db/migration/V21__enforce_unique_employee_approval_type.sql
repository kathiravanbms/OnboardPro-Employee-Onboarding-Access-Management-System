DELETE older
FROM approvals older
JOIN approvals newer
  ON newer.employee_id = older.employee_id
 AND newer.approval_type = older.approval_type
 AND newer.id > older.id;

ALTER TABLE approvals
  ADD CONSTRAINT uk_approvals_employee_type UNIQUE (employee_id, approval_type);
