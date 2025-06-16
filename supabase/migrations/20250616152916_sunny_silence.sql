/*
  # BankGuard AI Database Schema

  1. New Tables
    - `admin_users` - Dashboard administrator accounts
    - `behavioral_analytics` - Anonymized behavioral metrics storage
    - `fraud_alerts` - Real-time fraud detection alerts
    - `historical_fraud_cases` - Historical fraud patterns for RAG system
    - `fraud_analysis` - RAG analysis results
    - `system_logs` - Audit logs for compliance
    - `privacy_consents` - User privacy consent tracking
    - `model_versions` - ML model version management

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated admin users
    - Audit logging for compliance
    - Privacy-compliant data handling

  3. Privacy Compliance
    - GDPR/DPDP compliant data structures
    - Anonymized data storage only
    - Consent tracking and management
    - Data retention policies
*/

-- Create enum types for BankGuard AI
CREATE TYPE alert_severity AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE alert_status AS ENUM ('active', 'acknowledged', 'resolved', 'false_positive');
CREATE TYPE fraud_outcome AS ENUM ('confirmed_fraud', 'false_positive', 'under_investigation');
CREATE TYPE consent_status AS ENUM ('granted', 'denied', 'withdrawn', 'expired');

-- Admin users table
CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  full_name text NOT NULL,
  role text DEFAULT 'admin',
  is_active boolean DEFAULT true,
  last_login timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Behavioral analytics table (anonymized data only)
CREATE TABLE IF NOT EXISTS behavioral_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  user_hash text NOT NULL, -- Hashed user identifier for privacy
  timestamp timestamptz NOT NULL,
  risk_score decimal(5,4) NOT NULL CHECK (risk_score >= 0 AND risk_score <= 1),
  anomaly_flags text[] DEFAULT '{}',
  confidence_level decimal(5,4) NOT NULL CHECK (confidence_level >= 0 AND confidence_level <= 1),
  device_fingerprint text NOT NULL,
  time_of_day integer CHECK (time_of_day >= 0 AND time_of_day <= 23),
  day_of_week integer CHECK (day_of_week >= 0 AND day_of_week <= 6),
  location_hash text, -- Hashed location for privacy
  created_at timestamptz DEFAULT now()
);

-- Fraud alerts table
CREATE TABLE IF NOT EXISTS fraud_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  user_hash text NOT NULL,
  alert_type text NOT NULL,
  severity alert_severity NOT NULL,
  status alert_status DEFAULT 'active',
  risk_score decimal(5,4) NOT NULL,
  anomaly_flags text[] DEFAULT '{}',
  response_type text,
  message text,
  acknowledged_by uuid REFERENCES admin_users(id),
  acknowledged_at timestamptz,
  resolved_at timestamptz,
  resolution_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Historical fraud cases for RAG system
CREATE TABLE IF NOT EXISTS historical_fraud_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_reference text UNIQUE NOT NULL,
  description text NOT NULL,
  risk_score decimal(5,4) NOT NULL,
  anomaly_types text[] DEFAULT '{}',
  time_context text,
  device_pattern text,
  response_type text NOT NULL,
  outcome fraud_outcome NOT NULL,
  effectiveness_score decimal(5,4) DEFAULT 0.5,
  detection_method text,
  false_positive_reason text,
  lessons_learned text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Fraud analysis results from RAG system
CREATE TABLE IF NOT EXISTS fraud_analysis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  similar_patterns jsonb,
  analysis_text text,
  confidence_score decimal(5,4),
  recommendations text[],
  pattern_count integer DEFAULT 0,
  analysis_timestamp timestamptz DEFAULT now()
);

-- System logs for audit and compliance
CREATE TABLE IF NOT EXISTS system_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  log_level text NOT NULL,
  component text NOT NULL,
  action text NOT NULL,
  user_id uuid REFERENCES admin_users(id),
  session_id text,
  ip_address inet,
  user_agent text,
  details jsonb,
  timestamp timestamptz DEFAULT now()
);

-- Privacy consents tracking (GDPR/DPDP compliance)
CREATE TABLE IF NOT EXISTS privacy_consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_hash text NOT NULL, -- Hashed user identifier
  consent_type text NOT NULL,
  status consent_status NOT NULL,
  consent_text text NOT NULL,
  version text NOT NULL,
  granted_at timestamptz,
  withdrawn_at timestamptz,
  expires_at timestamptz,
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- ML model versions management
CREATE TABLE IF NOT EXISTS model_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model_name text NOT NULL,
  version text NOT NULL,
  model_type text NOT NULL,
  file_path text NOT NULL,
  file_size bigint,
  checksum text,
  performance_metrics jsonb,
  privacy_parameters jsonb,
  is_active boolean DEFAULT false,
  deployed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(model_name, version)
);

-- System configuration table
CREATE TABLE IF NOT EXISTS system_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key text UNIQUE NOT NULL,
  config_value jsonb NOT NULL,
  description text,
  is_sensitive boolean DEFAULT false,
  updated_by uuid REFERENCES admin_users(id),
  updated_at timestamptz DEFAULT now()
);

-- Insert default system configuration
INSERT INTO system_config (config_key, config_value, description) VALUES
  ('fraud_thresholds', '{"low": 0.3, "medium": 0.6, "high": 0.8, "critical": 0.95}', 'Risk score thresholds for fraud detection'),
  ('alert_settings', '{"email_notifications": true, "sms_notifications": false, "webhook_url": null}', 'Alert notification settings'),
  ('privacy_settings', '{"data_retention_days": 90, "anonymization_enabled": true, "consent_required": true}', 'Privacy and compliance settings'),
  ('model_settings', '{"auto_update": false, "fallback_enabled": true, "performance_threshold": 0.85}', 'ML model management settings');

-- Enable Row Level Security
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE behavioral_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE fraud_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE historical_fraud_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE fraud_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE privacy_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE model_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_config ENABLE ROW LEVEL SECURITY;

-- Admin users policies
CREATE POLICY "Admins can read all admin users" ON admin_users FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can update own profile" ON admin_users FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Behavioral analytics policies
CREATE POLICY "Admins can read behavioral analytics" ON behavioral_analytics FOR SELECT TO authenticated USING (true);
CREATE POLICY "System can insert behavioral analytics" ON behavioral_analytics FOR INSERT TO authenticated WITH CHECK (true);

-- Fraud alerts policies
CREATE POLICY "Admins can manage fraud alerts" ON fraud_alerts FOR ALL TO authenticated USING (true);

-- Historical fraud cases policies
CREATE POLICY "Admins can read historical fraud cases" ON historical_fraud_cases FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage fraud cases" ON historical_fraud_cases FOR ALL TO authenticated USING (true);

-- Fraud analysis policies
CREATE POLICY "Admins can read fraud analysis" ON fraud_analysis FOR SELECT TO authenticated USING (true);
CREATE POLICY "System can insert fraud analysis" ON fraud_analysis FOR INSERT TO authenticated WITH CHECK (true);

-- System logs policies
CREATE POLICY "Admins can read system logs" ON system_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "System can insert logs" ON system_logs FOR INSERT TO authenticated WITH CHECK (true);

-- Privacy consents policies
CREATE POLICY "Admins can read privacy consents" ON privacy_consents FOR SELECT TO authenticated USING (true);
CREATE POLICY "System can manage consents" ON privacy_consents FOR ALL TO authenticated USING (true);

-- Model versions policies
CREATE POLICY "Admins can read model versions" ON model_versions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage models" ON model_versions FOR ALL TO authenticated USING (true);

-- System config policies
CREATE POLICY "Admins can read system config" ON system_config FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can update system config" ON system_config FOR UPDATE TO authenticated USING (true);

-- Create indexes for better performance
CREATE INDEX idx_behavioral_analytics_timestamp ON behavioral_analytics(timestamp);
CREATE INDEX idx_behavioral_analytics_risk_score ON behavioral_analytics(risk_score);
CREATE INDEX idx_behavioral_analytics_user_hash ON behavioral_analytics(user_hash);
CREATE INDEX idx_fraud_alerts_severity ON fraud_alerts(severity);
CREATE INDEX idx_fraud_alerts_status ON fraud_alerts(status);
CREATE INDEX idx_fraud_alerts_created_at ON fraud_alerts(created_at);
CREATE INDEX idx_historical_fraud_cases_outcome ON historical_fraud_cases(outcome);
CREATE INDEX idx_historical_fraud_cases_risk_score ON historical_fraud_cases(risk_score);
CREATE INDEX idx_system_logs_timestamp ON system_logs(timestamp);
CREATE INDEX idx_system_logs_component ON system_logs(component);
CREATE INDEX idx_privacy_consents_user_hash ON privacy_consents(user_hash);
CREATE INDEX idx_privacy_consents_status ON privacy_consents(status);
CREATE INDEX idx_model_versions_active ON model_versions(is_active);

-- Create functions for data retention and cleanup
CREATE OR REPLACE FUNCTION cleanup_old_behavioral_data()
RETURNS void AS $$
BEGIN
  -- Delete behavioral analytics data older than retention period
  DELETE FROM behavioral_analytics 
  WHERE created_at < NOW() - INTERVAL '90 days';
  
  -- Delete resolved fraud alerts older than 1 year
  DELETE FROM fraud_alerts 
  WHERE status = 'resolved' AND resolved_at < NOW() - INTERVAL '1 year';
  
  -- Delete old system logs (keep 6 months)
  DELETE FROM system_logs 
  WHERE timestamp < NOW() - INTERVAL '6 months';
END;
$$ LANGUAGE plpgsql;

-- Create function to anonymize expired data
CREATE OR REPLACE FUNCTION anonymize_expired_data()
RETURNS void AS $$
BEGIN
  -- Further anonymize old behavioral data
  UPDATE behavioral_analytics 
  SET user_hash = 'anonymized_' || id::text,
      device_fingerprint = 'anonymized',
      location_hash = NULL
  WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Insert sample historical fraud cases for RAG system
INSERT INTO historical_fraud_cases (case_reference, description, risk_score, anomaly_types, time_context, device_pattern, response_type, outcome, effectiveness_score, detection_method) VALUES
  ('FRAUD-2024-001', 'Unusual typing pattern detected during login attempt with high pressure variance and irregular timing', 0.85, ARRAY['typing_anomaly', 'pressure_variance'], '02:30 AM weekday', 'mobile_device_android', 'otp_challenge', 'confirmed_fraud', 0.9, 'behavioral_biometrics'),
  ('FRAUD-2024-002', 'Abnormal touch dynamics with inconsistent pressure and rapid navigation patterns', 0.78, ARRAY['touch_anomaly', 'navigation_anomaly'], '14:15 PM weekend', 'mobile_device_ios', 'silent_faceid', 'confirmed_fraud', 0.85, 'behavioral_biometrics'),
  ('FRAUD-2024-003', 'Device orientation patterns inconsistent with normal user behavior during transaction', 0.72, ARRAY['orientation_anomaly', 'device_anomaly'], '09:45 AM weekday', 'tablet_device', 'session_termination', 'false_positive', 0.3, 'behavioral_biometrics'),
  ('FRAUD-2024-004', 'Multiple anomalies detected: typing rhythm, touch pressure, and navigation speed', 0.92, ARRAY['typing_anomaly', 'touch_anomaly', 'navigation_anomaly'], '23:20 PM weekday', 'mobile_device_android', 'account_lock', 'confirmed_fraud', 0.95, 'ensemble_model'),
  ('FRAUD-2024-005', 'Suspicious navigation patterns with rapid screen transitions and unusual touch areas', 0.68, ARRAY['navigation_anomaly', 'touch_anomaly'], '16:30 PM weekend', 'mobile_device_ios', 'otp_challenge', 'under_investigation', 0.6, 'behavioral_biometrics');

-- Insert sample system configuration for fraud detection
INSERT INTO fraud_alerts (session_id, user_hash, alert_type, severity, risk_score, anomaly_flags, response_type, message) VALUES
  ('session_001', 'user_hash_001', 'behavioral_anomaly', 'high', 0.82, ARRAY['typing_anomaly'], 'otp_challenge', 'Unusual typing patterns detected'),
  ('session_002', 'user_hash_002', 'device_anomaly', 'medium', 0.65, ARRAY['orientation_anomaly'], 'silent_faceid', 'Device orientation patterns anomalous'),
  ('session_003', 'user_hash_003', 'multiple_anomalies', 'critical', 0.94, ARRAY['typing_anomaly', 'touch_anomaly', 'navigation_anomaly'], 'account_lock', 'Multiple fraud indicators detected');