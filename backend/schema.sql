-- PostgreSQL schema for LeaveFlow
-- Designed for FastAPI + SQLAlchemy backend

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE,
  password_hash VARCHAR(255),  -- For dashboard login
  role VARCHAR(20) NOT NULL CHECK (role IN ('worker', 'manager', 'hr', 'admin')),
  manager_id INTEGER REFERENCES users(id),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Leave requests table
CREATE TABLE IF NOT EXISTS leave_requests (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days NUMERIC(4,1) NOT NULL CHECK (days > 0),  -- Supports half days
  leave_type VARCHAR(20) NOT NULL CHECK (leave_type IN ('casual', 'sick', 'special')),
  duration_type VARCHAR(20) NOT NULL DEFAULT 'full' CHECK (duration_type IN ('full', 'half_morning', 'half_afternoon')),
  reason TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  rejection_reason TEXT,
  approved_by INTEGER REFERENCES users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  escalated BOOLEAN NOT NULL DEFAULT FALSE,
  escalated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Leave balances table (per user per year)
CREATE TABLE IF NOT EXISTS leave_balances (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  casual NUMERIC(4,1) NOT NULL DEFAULT 12,
  sick NUMERIC(4,1) NOT NULL DEFAULT 12,
  special NUMERIC(4,1) NOT NULL DEFAULT 5,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, year)
);

-- Holidays table
CREATE TABLE IF NOT EXISTS holidays (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Attachments table (for medical certificates, etc.)
CREATE TABLE IF NOT EXISTS attachments (
  id SERIAL PRIMARY KEY,
  request_id INTEGER NOT NULL REFERENCES leave_requests(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_type VARCHAR(50),
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  action VARCHAR(100) NOT NULL,
  actor_id INTEGER REFERENCES users(id),
  request_id INTEGER REFERENCES leave_requests(id),
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Processed messages table (idempotency for WhatsApp webhooks)
CREATE TABLE IF NOT EXISTS processed_messages (
  id SERIAL PRIMARY KEY,
  message_id VARCHAR(255) UNIQUE NOT NULL,
  wa_id VARCHAR(50) NOT NULL,
  command VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_leave_requests_user_id ON leave_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON leave_requests(status);
CREATE INDEX IF NOT EXISTS idx_leave_requests_dates ON leave_requests(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_leave_balances_user_year ON leave_balances(user_id, year);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_manager ON users(manager_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_request ON audit_logs(request_id);
CREATE INDEX IF NOT EXISTS idx_processed_messages_wa_id ON processed_messages(wa_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leave_requests_updated_at BEFORE UPDATE ON leave_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leave_balances_updated_at BEFORE UPDATE ON leave_balances
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample data for testing
-- Admin user (password: admin123)
INSERT INTO users (name, phone, email, password_hash, role) VALUES
  ('Admin User', '+1234567890', 'admin@company.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewKyDEj1M0pmhjXK', 'admin')
ON CONFLICT (phone) DO NOTHING;

-- Sample manager (password: manager123)
INSERT INTO users (name, phone, email, password_hash, role) VALUES
  ('John Manager', '+1987654321', 'john.manager@company.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewKyDEj1M0pmhjXK', 'manager')
ON CONFLICT (phone) DO NOTHING;

-- Sample holidays for current year
INSERT INTO holidays (date, name) VALUES
  (DATE_TRUNC('year', CURRENT_DATE) + INTERVAL '0 days', 'New Year''s Day'),
  (DATE_TRUNC('year', CURRENT_DATE) + INTERVAL '25 days', 'Republic Day'),
  (DATE_TRUNC('year', CURRENT_DATE) + INTERVAL '225 days', 'Independence Day'),
  (DATE_TRUNC('year', CURRENT_DATE) + INTERVAL '275 days', 'Diwali'),
  (DATE_TRUNC('year', CURRENT_DATE) + INTERVAL '358 days', 'Christmas')
ON CONFLICT (date) DO NOTHING;
