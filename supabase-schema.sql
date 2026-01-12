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

-- TACs (Transaction Allocation Templates) table
CREATE TABLE IF NOT EXISTS tacs (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TAC Rows table - each TAC has multiple rows defining account allocations
CREATE TABLE IF NOT EXISTS tac_rows (
  id SERIAL PRIMARY KEY,
  tac_id INTEGER NOT NULL REFERENCES tacs(id) ON DELETE CASCADE,
  fisa_cont TEXT NOT NULL, -- Account sheet (e.g., "628", "628.ded", "401")
  cont_corespondent TEXT, -- Corresponding account (e.g., "401", "628", "4426")
  debit_formula TEXT, -- Formula for debit column (e.g., "Val_ded + Val_neded", "TVA_ded")
  credit_formula TEXT, -- Formula for credit column
  valuta_formula TEXT, -- Formula for currency value (e.g., "T.Val_Valuta")
  moneda_valuta_formula TEXT, -- Formula for currency type (e.g., "T.Moneda")
  row_order INTEGER NOT NULL DEFAULT 0, -- Order of rows in the TAC
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transactions table - stores transaction data with variables
CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  tac_id INTEGER REFERENCES tacs(id) ON DELETE SET NULL,
  transaction_date DATE NOT NULL,
  description TEXT,
  -- Transaction variables stored as JSONB for flexibility
  variables JSONB DEFAULT '{}'::jsonb,
  -- Common variables that might be used:
  -- Val_ded, Val_neded, TVA_ded, Val_Valuta, Moneda, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Account File Entries - generated entries from applying TACs to transactions
CREATE TABLE IF NOT EXISTS account_file_entries (
  id SERIAL PRIMARY KEY,
  transaction_id INTEGER NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  fisa_cont TEXT NOT NULL, -- Account sheet where this entry belongs
  cont_corespondent TEXT, -- Corresponding account
  debit NUMERIC DEFAULT 0, -- Calculated debit amount
  credit NUMERIC DEFAULT 0, -- Calculated credit amount
  valuta NUMERIC, -- Currency value
  moneda_valuta TEXT, -- Currency type
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE tacs ENABLE ROW LEVEL SECURITY;
ALTER TABLE tac_rows ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_file_entries ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all operations
CREATE POLICY "Allow all operations on tacs" ON tacs
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on tac_rows" ON tac_rows
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on transactions" ON transactions
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on account_file_entries" ON account_file_entries
  FOR ALL USING (true) WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_employees_id ON employees(id);
CREATE INDEX IF NOT EXISTS idx_legal_settings_key ON legal_settings(key);
CREATE INDEX IF NOT EXISTS idx_working_days_year_month ON working_days(year, month);
CREATE INDEX IF NOT EXISTS idx_tac_rows_tac_id ON tac_rows(tac_id);
CREATE INDEX IF NOT EXISTS idx_transactions_tac_id ON transactions(tac_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_account_file_entries_transaction_id ON account_file_entries(transaction_id);
CREATE INDEX IF NOT EXISTS idx_account_file_entries_fisa_cont ON account_file_entries(fisa_cont);