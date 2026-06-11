CREATE TABLE system_catalog (
  id BIGINT NOT NULL AUTO_INCREMENT,
  name VARCHAR(160) NOT NULL,
  category VARCHAR(80) NOT NULL,
  description VARCHAR(1000) NOT NULL,
  access_levels VARCHAR(160) NOT NULL,
  owner VARCHAR(160) NOT NULL,
  status VARCHAR(32) NOT NULL,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE KEY uk_system_catalog_name (name)
);

CREATE TABLE access_assignments (
  id BIGINT NOT NULL AUTO_INCREMENT,
  employee_id BIGINT,
  employee_code VARCHAR(40),
  employee_name VARCHAR(120) NOT NULL,
  employee_email VARCHAR(160) NOT NULL,
  system_name VARCHAR(160) NOT NULL,
  approved_by VARCHAR(160),
  priority VARCHAR(32) NOT NULL,
  status VARCHAR(32) NOT NULL,
  access_level VARCHAR(80),
  notes VARCHAR(1000),
  credentials VARCHAR(1000),
  provisioned_on DATE,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  KEY idx_access_assignments_employee (employee_id),
  KEY idx_access_assignments_status (status),
  CONSTRAINT fk_access_assignments_employee FOREIGN KEY (employee_id) REFERENCES employees(id)
);

CREATE TABLE access_deactivations (
  id BIGINT NOT NULL AUTO_INCREMENT,
  employee_id BIGINT,
  employee_code VARCHAR(40),
  employee_name VARCHAR(120) NOT NULL,
  employee_email VARCHAR(160) NOT NULL,
  department VARCHAR(80) NOT NULL,
  exit_date DATE NOT NULL,
  reason VARCHAR(120) NOT NULL,
  systems TEXT NOT NULL,
  notes VARCHAR(1000) NOT NULL,
  requested_by VARCHAR(160),
  status VARCHAR(32) NOT NULL,
  deactivated_on DATE,
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  KEY idx_access_deactivations_employee (employee_id),
  KEY idx_access_deactivations_status (status),
  CONSTRAINT fk_access_deactivations_employee FOREIGN KEY (employee_id) REFERENCES employees(id)
);

