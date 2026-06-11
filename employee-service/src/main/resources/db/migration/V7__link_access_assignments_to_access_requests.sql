ALTER TABLE access_assignments
  ADD COLUMN access_request_id BIGINT NULL,
  ADD KEY idx_access_assignments_access_request (access_request_id),
  ADD CONSTRAINT fk_access_assignments_access_request FOREIGN KEY (access_request_id) REFERENCES access_requests(id);
