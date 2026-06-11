ALTER TABLE notifications
  ADD COLUMN recipient_user_id BIGINT NULL AFTER employee_id,
  ADD COLUMN read_status BIT NOT NULL DEFAULT b'0' AFTER message,
  ADD KEY idx_notifications_recipient_user (recipient_user_id),
  ADD KEY idx_notifications_recipient_role (recipient_role);

ALTER TABLE notifications
  MODIFY read_flag BIT NOT NULL DEFAULT b'0';

UPDATE notifications
SET recipient_user_id = employee_id,
    read_status = read_flag;
