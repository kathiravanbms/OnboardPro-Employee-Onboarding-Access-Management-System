CREATE TABLE training_modules (
  id BIGINT NOT NULL AUTO_INCREMENT,
  title VARCHAR(160) NOT NULL,
  description VARCHAR(1000) NOT NULL,
  video_url LONGTEXT NOT NULL,
  pdf_url LONGTEXT NOT NULL,
  upload_date TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  created_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  KEY idx_training_modules_upload_date (upload_date)
);

CREATE TABLE training_completions (
  id BIGINT NOT NULL AUTO_INCREMENT,
  employee_id BIGINT NOT NULL,
  training_module_id BIGINT NOT NULL,
  completed_at TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE KEY uk_training_completion_employee_module (employee_id, training_module_id),
  KEY idx_training_completions_employee (employee_id),
  KEY idx_training_completions_module (training_module_id),
  CONSTRAINT fk_training_completions_employee FOREIGN KEY (employee_id) REFERENCES employees(id),
  CONSTRAINT fk_training_completions_module FOREIGN KEY (training_module_id) REFERENCES training_modules(id)
);
