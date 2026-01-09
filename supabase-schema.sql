-- Supabase Database Schema
-- Run this SQL in your Supabase SQL Editor to create the necessary tables

-- Employees table
CREATE TABLE IF NOT EXISTS employees (
  id INTEGER PRIMARY KEY,
  unique_id TEXT,
  nume TEXT NOT NULL,
  companie TEXT NOT NULL,
  principal_loc_munca TEXT NOT NULL,
  persoane_intretinere INTEGER DEFAULT 0,
  din_care_minori INTEGER DEFAULT 0,
  varsta INTEGER DEFAULT 0,
  tichete_de_masa TEXT,
  valoare_tichet_de_masa NUMERIC,
  zile_co_medical INTEGER,
  indemnizatie_zi_co_medical NUMERIC,
  zile_co_odihna INTEGER,
  indemnizatie_zi_co_odihna NUMERIC,
  salariu_cim NUMERIC,
  sal_brut_cf_zile_lucrate_rounded INTEGER,
  indem_co_medical_rounded INTEGER,
  indem_co_odihna_rounded INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Legal Settings table
CREATE TABLE IF NOT EXISTS legal_settings (
  key TEXT PRIMARY KEY,
  current_value NUMERIC NOT NULL,
  history JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Working Days table
CREATE TABLE IF NOT EXISTS working_days (
  id SERIAL PRIMARY KEY,
  year TEXT NOT NULL,
  month INTEGER NOT NULL,
  days INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(year, month)
);

-- Enable Row Level Security (RLS) - adjust policies as needed
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE legal_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE working_days ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all operations (adjust based on your auth requirements)
-- For now, allowing all operations for authenticated and anonymous users
-- You should adjust these based on your security requirements

CREATE POLICY "Allow all operations on employees" ON employees
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on legal_settings" ON legal_settings
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on working_days" ON working_days
  FOR ALL USING (true) WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_employees_id ON employees(id);
CREATE INDEX IF NOT EXISTS idx_legal_settings_key ON legal_settings(key);
CREATE INDEX IF NOT EXISTS idx_working_days_year_month ON working_days(year, month);
