ALTER TABLE system_catalog
  ADD COLUMN created_by VARCHAR(160) NULL AFTER status,
  ADD COLUMN approved_by VARCHAR(160) NULL AFTER created_by,
  ADD COLUMN approved_at TIMESTAMP(6) NULL AFTER approved_by,
  ADD COLUMN rejection_reason VARCHAR(1000) NULL AFTER approved_at;

UPDATE system_catalog
SET status = 'ACTIVE'
WHERE LOWER(status) = 'active';

UPDATE system_catalog
SET status = 'ARCHIVED'
WHERE LOWER(status) IN ('inactive', 'archived');
