CREATE TABLE departments (
  id BIGINT NOT NULL AUTO_INCREMENT,
  name VARCHAR(80) NOT NULL,
  code VARCHAR(32) NOT NULL,
  active BIT NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE KEY uk_departments_name (name),
  UNIQUE KEY uk_departments_code (code)
);

CREATE TABLE employees (
  id BIGINT NOT NULL AUTO_INCREMENT,
  employee_code VARCHAR(40) NOT NULL,
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL,
  department_id BIGINT NOT NULL,
  job_title VARCHAR(120) NOT NULL,
  manager_name VARCHAR(120),
  start_date DATE NOT NULL,
  status VARCHAR(32) NOT NULL,
  onboarding_status VARCHAR(32) NOT NULL,
  onboarding_progress INT NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE KEY uk_employees_code (employee_code),
  UNIQUE KEY uk_employees_email (email),
  CONSTRAINT fk_employees_department FOREIGN KEY (department_id) REFERENCES departments(id)
);

CREATE TABLE onboarding_tasks (
  id BIGINT NOT NULL AUTO_INCREMENT,
  employee_id BIGINT NOT NULL,
  title VARCHAR(140) NOT NULL,
  description VARCHAR(1000),
  assigned_role VARCHAR(32) NOT NULL,
  status VARCHAR(32) NOT NULL,
  due_date DATE,
  completed_at TIMESTAMP(6) NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  KEY idx_tasks_employee (employee_id),
  CONSTRAINT fk_tasks_employee FOREIGN KEY (employee_id) REFERENCES employees(id)
);

CREATE TABLE documents (
  id BIGINT NOT NULL AUTO_INCREMENT,
  employee_id BIGINT NOT NULL,
  document_type VARCHAR(120) NOT NULL,
  file_name VARCHAR(240) NOT NULL,
  storage_url VARCHAR(500) NOT NULL,
  content_type VARCHAR(120),
  file_size BIGINT,
  status VARCHAR(32) NOT NULL,
  review_comment VARCHAR(500),
  reviewed_by VARCHAR(160),
  reviewed_at TIMESTAMP(6) NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  KEY idx_documents_employee (employee_id),
  CONSTRAINT fk_documents_employee FOREIGN KEY (employee_id) REFERENCES employees(id)
);

CREATE TABLE approvals (
  id BIGINT NOT NULL AUTO_INCREMENT,
  employee_id BIGINT NOT NULL,
  approval_type VARCHAR(32) NOT NULL,
  status VARCHAR(32) NOT NULL,
  requested_by VARCHAR(160),
  approver VARCHAR(160),
  remarks VARCHAR(500),
  decided_at TIMESTAMP(6) NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  KEY idx_approvals_employee (employee_id),
  CONSTRAINT fk_approvals_employee FOREIGN KEY (employee_id) REFERENCES employees(id)
);

CREATE TABLE access_requests (
  id BIGINT NOT NULL AUTO_INCREMENT,
  employee_id BIGINT NOT NULL,
  system_name VARCHAR(120) NOT NULL,
  justification VARCHAR(500),
  status VARCHAR(32) NOT NULL,
  requested_by VARCHAR(160),
  approved_by VARCHAR(160),
  provisioned_by VARCHAR(160),
  remarks VARCHAR(500),
  decided_at TIMESTAMP(6) NULL,
  provisioned_at TIMESTAMP(6) NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  KEY idx_access_requests_employee (employee_id),
  CONSTRAINT fk_access_requests_employee FOREIGN KEY (employee_id) REFERENCES employees(id)
);

CREATE TABLE notifications (
  id BIGINT NOT NULL AUTO_INCREMENT,
  employee_id BIGINT,
  recipient_email VARCHAR(160) NOT NULL,
  recipient_role VARCHAR(160) NOT NULL,
  title VARCHAR(160) NOT NULL,
  message VARCHAR(1000) NOT NULL,
  read_flag BIT NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  KEY idx_notifications_employee (employee_id),
  KEY idx_notifications_recipient_email (recipient_email),
  CONSTRAINT fk_notifications_employee FOREIGN KEY (employee_id) REFERENCES employees(id)
);

INSERT INTO departments (name, code, active) VALUES
  ('Information Technology', 'IT', 1),
  ('Human Resources', 'HR', 1),
  ('Management', 'MGR', 1),
  ('Employee Operations', 'EMP', 1);
