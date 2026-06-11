ALTER TABLE employees
  ADD COLUMN phone_number VARCHAR(40) NULL,
  ADD COLUMN date_of_birth DATE NULL,
  ADD COLUMN gender VARCHAR(32) NULL,
  ADD COLUMN address VARCHAR(1000) NULL,
  ADD COLUMN emergency_contact_name VARCHAR(120) NULL,
  ADD COLUMN emergency_contact_phone VARCHAR(40) NULL,
  ADD COLUMN policy_conduct_acknowledged BIT NOT NULL DEFAULT 0,
  ADD COLUMN policy_working_hours_acknowledged BIT NOT NULL DEFAULT 0,
  ADD COLUMN policy_anti_harassment_acknowledged BIT NOT NULL DEFAULT 0,
  ADD COLUMN policy_data_security_acknowledged BIT NOT NULL DEFAULT 0,
  ADD COLUMN policy_health_safety_acknowledged BIT NOT NULL DEFAULT 0;
