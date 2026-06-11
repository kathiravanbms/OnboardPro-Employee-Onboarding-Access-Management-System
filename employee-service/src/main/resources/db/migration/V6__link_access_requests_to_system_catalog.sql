ALTER TABLE access_requests
  ADD COLUMN system_catalog_id BIGINT NULL AFTER employee_id,
  ADD KEY idx_access_requests_system_catalog (system_catalog_id),
  ADD CONSTRAINT fk_access_requests_system_catalog FOREIGN KEY (system_catalog_id) REFERENCES system_catalog(id);

