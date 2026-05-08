ALTER TABLE schools
  ADD COLUMN subdomain VARCHAR(120) NULL;

CREATE UNIQUE INDEX idx_schools_subdomain_unique ON schools(subdomain);

