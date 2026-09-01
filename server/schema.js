"use strict";

const { usePostgres } = require("./db");

function getSchema() {
  if (!usePostgres()) return "";

  return `
CREATE TABLE IF NOT EXISTS admin_users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) DEFAULT 'Administrator',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS documents (
  id SERIAL PRIMARY KEY,
  document_id VARCHAR(50) UNIQUE NOT NULL,
  applicant_name VARCHAR(255) NOT NULL,
  document_type VARCHAR(255) NOT NULL,
  issue_date VARCHAR(20),
  expiry_date VARCHAR(20),
  status VARCHAR(50) DEFAULT 'active',
  notes TEXT,
  file_name VARCHAR(500),
  file_path VARCHAR(500),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cms_pages (
  slug VARCHAR(100) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  meta_description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cms_blocks (
  id SERIAL PRIMARY KEY,
  page_slug VARCHAR(100) NOT NULL REFERENCES cms_pages(slug) ON DELETE CASCADE,
  block_key VARCHAR(100) NOT NULL,
  label VARCHAR(255),
  content_type VARCHAR(20) DEFAULT 'text',
  content TEXT,
  UNIQUE(page_slug, block_key)
);

CREATE TABLE IF NOT EXISTS contact_submissions (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  subject VARCHAR(255),
  message TEXT,
  form_type VARCHAR(50) DEFAULT 'contact',
  extra_data TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS page_views (
  id SERIAL PRIMARY KEY,
  visitor_id VARCHAR(64),
  page_path VARCHAR(500) NOT NULL,
  referrer VARCHAR(500),
  country VARCHAR(100),
  city VARCHAR(100),
  region VARCHAR(100),
  user_agent TEXT,
  duration_seconds INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS verification_logs (
  id SERIAL PRIMARY KEY,
  document_id VARCHAR(50),
  found BOOLEAN DEFAULT FALSE,
  status VARCHAR(50),
  visitor_id VARCHAR(64),
  country VARCHAR(100),
  city VARCHAR(100),
  region VARCHAR(100),
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
`;
}

module.exports = { getSchema };
