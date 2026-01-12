import { supabase } from './supabase';

// Helper to check if Supabase is configured
function checkSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!url || !key) {
    console.error('Supabase configuration missing. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file.');
    return false;
  }
  return true;
}

export interface Employee {
  id: number;
  uniqueId?: string;
  nume: string;
  companie: string;
  principalLocMunca: string;
  persoaneIntretinere: number;
  dinCareMinori: number;
  varsta: number;
  ticheteDeMasa?: string;
  valoareTichetDeMasa?: number | null;
  zileCOMedical?: number | null;
  indemnizatieZiCOMedical?: number | null;
  zileCOOdihna?: number | null;
  indemnizatieZiCOOdihna?: number | null;
  salariuCIM?: number | null;
  salBrutCfZileLucrateRounded?: number | null;
  indemCOMedicalRounded?: number | null;
  indemCOOdihnaRounded?: number | null;
}

export interface AttributeHistory {
  value: number;
  startDate: string;
  endDate: string | null;
}

export interface AttributeData {
  currentValue: number;
  history: AttributeHistory[];
}

export interface LegalSettings {
  [key: string]: AttributeData;
}

export interface WorkingDaysData {
  [year: string]: {
    [month: number]: number;
  };
}

// Employees
export async function getEmployees(): Promise<Employee[]> {
  if (!checkSupabaseConfig()) {
    return [];
  }
  
  try {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      // Check if table doesn't exist (common error code: PGRST116 or 42P01)
      const errorMessage = error.message || String(error);
      const errorCode = error.code || '';
      
      if (errorCode === 'PGRST116' || errorCode === '42P01' || errorMessage?.includes('relation') || errorMessage?.includes('does not exist')) {
        console.warn('Employees table does not exist yet. Please run the SQL schema in Supabase.');
        return [];
      }
      
      // Log the full error object and its properties
      console.error('Error fetching employees:', error);
      if (error.message) console.error('Error message:', error.message);
      if (error.code) console.error('Error code:', error.code);
      if (error.details) console.error('Error details:', error.details);
      if (error.hint) console.error('Error hint:', error.hint);
      
      return [];
    }

    if (!data) return [];

    // Map snake_case to camelCase
    return data.map((row: any) => ({
      id: row.id,
      uniqueId: row.unique_id,
      nume: row.nume,
      companie: row.companie,
      principalLocMunca: row.principal_loc_munca,
      persoaneIntretinere: row.persoane_intretinere,
      dinCareMinori: row.din_care_minori,
      varsta: row.varsta,
      ticheteDeMasa: row.tichete_de_masa,
      valoareTichetDeMasa: row.valoare_tichet_de_masa,
      zileCOMedical: row.zile_co_medical,
      indemnizatieZiCOMedical: row.indemnizatie_zi_co_medical,
      zileCOOdihna: row.zile_co_odihna,
      indemnizatieZiCOOdihna: row.indemnizatie_zi_co_odihna,
      salariuCIM: row.salariu_cim,
      salBrutCfZileLucrateRounded: row.sal_brut_cf_zile_lucrate_rounded,
      indemCOMedicalRounded: row.indem_co_medical_rounded,
      indemCOOdihnaRounded: row.indem_co_odihna_rounded
    }));
  } catch (err) {
    console.error('Unexpected error fetching employees:', err);
    return [];
  }
}

export async function saveEmployees(employees: Employee[]): Promise<boolean> {
  // Delete all existing employees and insert new ones
  const { error: deleteError } = await supabase
    .from('employees')
    .delete()
    .neq('id', 0); // Delete all rows

  if (deleteError) {
    console.error('Error deleting employees:', deleteError);
    return false;
  }

  if (employees.length === 0) {
    return true;
  }

  // Map camelCase to snake_case
  const rows = employees.map(emp => ({
    id: emp.id,
    unique_id: emp.uniqueId,
    nume: emp.nume,
    companie: emp.companie,
    principal_loc_munca: emp.principalLocMunca,
    persoane_intretinere: emp.persoaneIntretinere,
    din_care_minori: emp.dinCareMinori,
    varsta: emp.varsta,
    tichete_de_masa: emp.ticheteDeMasa,
    valoare_tichet_de_masa: emp.valoareTichetDeMasa,
    zile_co_medical: emp.zileCOMedical,
    indemnizatie_zi_co_medical: emp.indemnizatieZiCOMedical,
    zile_co_odihna: emp.zileCOOdihna,
    indemnizatie_zi_co_odihna: emp.indemnizatieZiCOOdihna,
    salariu_cim: emp.salariuCIM,
    sal_brut_cf_zile_lucrate_rounded: emp.salBrutCfZileLucrateRounded,
    indem_co_medical_rounded: emp.indemCOMedicalRounded,
    indem_co_odihna_rounded: emp.indemCOOdihnaRounded
  }));

  const { error: insertError } = await supabase
    .from('employees')
    .insert(rows);

  if (insertError) {
    console.error('Error inserting employees:', insertError);
    return false;
  }

  return true;
}

export async function addEmployee(employee: Employee): Promise<boolean> {
  // Map camelCase to snake_case
  const row = {
    id: employee.id,
    unique_id: employee.uniqueId,
    nume: employee.nume,
    companie: employee.companie,
    principal_loc_munca: employee.principalLocMunca,
    persoane_intretinere: employee.persoaneIntretinere,
    din_care_minori: employee.dinCareMinori,
    varsta: employee.varsta,
    tichete_de_masa: employee.ticheteDeMasa,
    valoare_tichet_de_masa: employee.valoareTichetDeMasa,
    zile_co_medical: employee.zileCOMedical,
    indemnizatie_zi_co_medical: employee.indemnizatieZiCOMedical,
    zile_co_odihna: employee.zileCOOdihna,
    indemnizatie_zi_co_odihna: employee.indemnizatieZiCOOdihna,
    salariu_cim: employee.salariuCIM,
    sal_brut_cf_zile_lucrate_rounded: employee.salBrutCfZileLucrateRounded,
    indem_co_medical_rounded: employee.indemCOMedicalRounded,
    indem_co_odihna_rounded: employee.indemCOOdihnaRounded
  };

  const { error } = await supabase
    .from('employees')
    .insert([row]);

  if (error) {
    console.error('Error adding employee:', error);
    return false;
  }

  return true;
}

export async function deleteEmployee(id: number): Promise<boolean> {
  if (!checkSupabaseConfig()) {
    console.error('Supabase not configured. Cannot delete employee.');
    return false;
  }

  const { error } = await supabase
    .from('employees')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting employee:', error);
    return false;
  }

  return true;
}

// Legal Settings
export async function getLegalSettings(): Promise<LegalSettings> {
  if (!checkSupabaseConfig()) {
    return {};
  }
  
  try {
    const { data, error } = await supabase
      .from('legal_settings')
      .select('*');

    if (error) {
      // Check if table doesn't exist
      const errorMessage = error.message || String(error);
      const errorCode = error.code || '';
      
      if (errorCode === 'PGRST116' || errorCode === '42P01' || errorMessage?.includes('relation') || errorMessage?.includes('does not exist')) {
        console.warn('Legal settings table does not exist yet. Please run the SQL schema in Supabase.');
        return {};
      }
      
      // Log the full error object and its properties
      console.error('Error fetching legal settings:', error);
      if (error.message) console.error('Error message:', error.message);
      if (error.code) console.error('Error code:', error.code);
      if (error.details) console.error('Error details:', error.details);
      if (error.hint) console.error('Error hint:', error.hint);
      
      return {};
    }

    if (!data || data.length === 0) {
      return {};
    }

    // Convert array to object format
    const settings: LegalSettings = {};
    data.forEach((row: any) => {
      settings[row.key] = {
        currentValue: row.current_value,
        history: row.history || []
      };
    });

    return settings;
  } catch (err) {
    console.error('Unexpected error fetching legal settings:', err);
    return {};
  }
}

export async function saveLegalSettings(settings: LegalSettings): Promise<boolean> {
  if (!checkSupabaseConfig()) {
    console.error('Supabase not configured. Cannot save legal settings.');
    return false;
  }

  try {
    // Convert object to array format for Supabase
    const rows = Object.entries(settings).map(([key, value]) => ({
      key: String(key),
      current_value: typeof value.currentValue === 'number' ? value.currentValue : parseFloat(String(value.currentValue)) || 0,
      history: Array.isArray(value.history) ? value.history : []
    }));

    console.log('Preparing to save legal settings:', { 
      totalRows: rows.length, 
      sampleRows: rows.slice(0, 3),
      allKeys: Object.keys(settings)
    });

    if (rows.length === 0) {
      console.warn('No legal settings data to save.');
      return true;
    }

    // Delete all existing settings first
    // Supabase requires a filter, so we need to select first
    const { data: existingRows, error: selectError } = await supabase
      .from('legal_settings')
      .select('key');

    if (selectError && selectError.code !== 'PGRST116' && selectError.code !== '42P01') {
      // If it's not a "table doesn't exist" error, log it but continue
      console.warn('Could not select existing rows (table might be empty):', selectError);
    }

    // Delete existing rows if any exist
    if (existingRows && existingRows.length > 0) {
      const keysToDelete = existingRows.map(row => row.key);
      const { error: deleteError } = await supabase
        .from('legal_settings')
        .delete()
        .in('key', keysToDelete);

      if (deleteError) {
        console.error('Error deleting existing legal settings:', {
          error: deleteError,
          message: deleteError?.message,
          code: deleteError?.code,
          details: deleteError?.details,
          hint: deleteError?.hint
        });
        // Continue anyway - might be able to insert
      } else {
        console.log(`Deleted ${existingRows.length} existing legal settings rows.`);
      }
    }

    // Insert new settings using upsert (insert or update based on key)
    const { data: insertedData, error: insertError } = await supabase
      .from('legal_settings')
      .upsert(rows, {
        onConflict: 'key',
        ignoreDuplicates: false
      })
      .select();

    if (insertError) {
      console.error('Error upserting legal settings:', {
        error: insertError,
        message: insertError?.message || 'No message',
        code: insertError?.code || 'No code',
        details: insertError?.details || 'No details',
        hint: insertError?.hint || 'No hint',
        fullError: JSON.stringify(insertError, null, 2)
      });
      console.error('Attempted to insert rows:', rows.slice(0, 5));
      return false;
    }

    console.log(`Successfully saved ${insertedData?.length || rows.length} legal settings rows to Supabase.`);
    return true;
  } catch (err) {
    console.error('Unexpected error in saveLegalSettings:', err);
    if (err instanceof Error) {
      console.error('Error message:', err.message);
      console.error('Error stack:', err.stack);
    }
    return false;
  }
}

// Working Days
export async function getWorkingDays(): Promise<WorkingDaysData> {
  if (!checkSupabaseConfig()) {
    return {};
  }
  
  try {
    const { data, error } = await supabase
      .from('working_days')
      .select('*');

    if (error) {
      // Check if table doesn't exist
      const errorMessage = error.message || String(error);
      const errorCode = error.code || '';
      
      if (errorCode === 'PGRST116' || errorCode === '42P01' || errorMessage?.includes('relation') || errorMessage?.includes('does not exist')) {
        console.warn('Working days table does not exist yet. Please run the SQL schema in Supabase.');
        return {};
      }
      
      // Log the full error object and its properties
      console.error('Error fetching working days:', error);
      if (error.message) console.error('Error message:', error.message);
      if (error.code) console.error('Error code:', error.code);
      if (error.details) console.error('Error details:', error.details);
      if (error.hint) console.error('Error hint:', error.hint);
      
      return {};
    }

    if (!data || data.length === 0) {
      return {};
    }

    // Convert array to object format
    const workingDays: WorkingDaysData = {};
    data.forEach((row: any) => {
      if (!workingDays[row.year]) {
        workingDays[row.year] = {};
      }
      workingDays[row.year][row.month] = row.days;
    });

    return workingDays;
  } catch (err) {
    console.error('Unexpected error fetching working days:', err);
    return {};
  }
}

export async function saveWorkingDays(workingDays: WorkingDaysData): Promise<boolean> {
  if (!checkSupabaseConfig()) {
    console.error('Supabase not configured. Cannot save working days.');
    return false;
  }

  try {
    // Convert object to array format for Supabase
    const rows: Array<{ year: string; month: number; days: number }> = [];
    
    Object.entries(workingDays).forEach(([year, months]) => {
      Object.entries(months).forEach(([month, days]) => {
        const monthNum = parseInt(month);
        const daysNum = typeof days === 'number' ? days : parseInt(String(days));
        
        if (isNaN(monthNum) || isNaN(daysNum)) {
          console.warn(`Invalid data for year ${year}, month ${month}, days ${days}`);
          return;
        }
        
        rows.push({
          year: String(year),
          month: monthNum,
          days: daysNum
        });
      });
    });

    console.log('Preparing to save working days:', { 
      totalRows: rows.length, 
      sampleRows: rows.slice(0, 3),
      allYears: Object.keys(workingDays)
    });

    if (rows.length === 0) {
      console.warn('No valid working days data to save.');
      return true;
    }

    // Delete all existing working days first
    // Supabase requires a filter, so we need to select first or use a different approach
    const { data: existingRows, error: selectError } = await supabase
      .from('working_days')
      .select('id');

    if (selectError && selectError.code !== 'PGRST116' && selectError.code !== '42P01') {
      // If it's not a "table doesn't exist" error, log it but continue
      console.warn('Could not select existing rows (table might be empty):', selectError);
    }

    // Delete existing rows if any exist
    if (existingRows && existingRows.length > 0) {
      const idsToDelete = existingRows.map(row => row.id);
      const { error: deleteError } = await supabase
        .from('working_days')
        .delete()
        .in('id', idsToDelete);

      if (deleteError) {
        console.error('Error deleting existing working days:', {
          error: deleteError,
          message: deleteError?.message,
          code: deleteError?.code,
          details: deleteError?.details,
          hint: deleteError?.hint
        });
        // Continue anyway - might be able to insert
      } else {
        console.log(`Deleted ${existingRows.length} existing working days rows.`);
      }
    }

    // Insert new working days
    const { data: insertedData, error: insertError } = await supabase
      .from('working_days')
      .insert(rows)
      .select();

    if (insertError) {
      console.error('Error inserting working days:', {
        error: insertError,
        message: insertError?.message || 'No message',
        code: insertError?.code || 'No code',
        details: insertError?.details || 'No details',
        hint: insertError?.hint || 'No hint',
        fullError: JSON.stringify(insertError, null, 2)
      });
      console.error('Attempted to insert rows:', rows.slice(0, 5));
      return false;
    }

    console.log(`Successfully saved ${insertedData?.length || rows.length} working days rows to Supabase.`);
    return true;
  } catch (err) {
    console.error('Unexpected error in saveWorkingDays:', err);
    if (err instanceof Error) {
      console.error('Error message:', err.message);
      console.error('Error stack:', err.stack);
    }
    return false;
  }
}

// TAC (Transaction Allocation Template) interfaces and functions
export interface TAC {
  id: number;
  name: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TACRow {
  id: number;
  tacId: number;
  fisaCont: string;
  contCorespondent?: string;
  debitFormula?: string;
  creditFormula?: string;
  valutaFormula?: string;
  monedaValutaFormula?: string;
  rowOrder: number;
}

export interface Transaction {
  id: number;
  tacId?: number;
  transactionDate: string;
  description?: string;
  variables: Record<string, any>;
}

export interface AccountFileEntry {
  id: number;
  transactionId: number;
  fisaCont: string;
  contCorespondent?: string;
  debit: number;
  credit: number;
  valuta?: number;
  monedaValuta?: string;
}

// TAC Functions
export async function getTACs(): Promise<TAC[]> {
  if (!checkSupabaseConfig()) {
    return [];
  }
  
  try {
    const { data, error } = await supabase
      .from('tacs')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      console.error('Error fetching TACs:', error);
      return [];
    }

    if (!data) return [];

    return data.map((row: any) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
  } catch (err) {
    console.error('Unexpected error fetching TACs:', err);
    return [];
  }
}

export async function getTACById(id: number): Promise<TAC | null> {
  if (!checkSupabaseConfig()) {
    return null;
  }
  
  try {
    const { data, error } = await supabase
      .from('tacs')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching TAC:', error);
      return null;
    }

    if (!data) return null;

    return {
      id: data.id,
      name: data.name,
      description: data.description,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  } catch (err) {
    console.error('Unexpected error fetching TAC:', err);
    return null;
  }
}

export async function getTACRows(tacId: number): Promise<TACRow[]> {
  if (!checkSupabaseConfig()) {
    return [];
  }
  
  try {
    const { data, error } = await supabase
      .from('tac_rows')
      .select('*')
      .eq('tac_id', tacId)
      .order('row_order', { ascending: true });

    if (error) {
      console.error('Error fetching TAC rows:', error);
      return [];
    }

    if (!data) return [];

    return data.map((row: any) => ({
      id: row.id,
      tacId: row.tac_id,
      fisaCont: row.fisa_cont,
      contCorespondent: row.cont_corespondent,
      debitFormula: row.debit_formula,
      creditFormula: row.credit_formula,
      valutaFormula: row.valuta_formula,
      monedaValutaFormula: row.moneda_valuta_formula,
      rowOrder: row.row_order
    }));
  } catch (err) {
    console.error('Unexpected error fetching TAC rows:', err);
    return [];
  }
}

export async function saveTAC(tac: Omit<TAC, 'id' | 'createdAt' | 'updatedAt'>, rows: Omit<TACRow, 'id' | 'tacId'>[]): Promise<number | null> {
  if (!checkSupabaseConfig()) {
    console.error('Supabase not configured. Cannot save TAC.');
    return null;
  }

  try {
    // Validate input
    if (!tac.name || tac.name.trim() === '') {
      console.error('Error saving TAC: TAC name is required');
      return null;
    }

    // Insert or update TAC
    const tacData = {
      name: tac.name.trim(),
      description: tac.description ? tac.description.trim() : null
    };

    const { data: tacResult, error: tacError } = await supabase
      .from('tacs')
      .insert([tacData])
      .select()
      .single();

    if (tacError) {
      console.error('Error saving TAC:', {
        error: tacError,
        message: tacError?.message || 'No message',
        code: tacError?.code || 'No code',
        details: tacError?.details || 'No details',
        hint: tacError?.hint || 'No hint',
        fullError: JSON.stringify(tacError, null, 2)
      });
      return null;
    }

    if (!tacResult) {
      console.error('Error saving TAC: No data returned from insert');
      return null;
    }

    const tacId = tacResult.id;

    // Delete existing rows
    const { error: deleteError } = await supabase
      .from('tac_rows')
      .delete()
      .eq('tac_id', tacId);

    if (deleteError) {
      console.error('Error deleting existing TAC rows:', deleteError);
    }

    // Insert new rows
    if (rows.length > 0) {
      const rowsData = rows.map((row, index) => ({
        tac_id: tacId,
        fisa_cont: row.fisaCont,
        cont_corespondent: row.contCorespondent || null,
        debit_formula: row.debitFormula || null,
        credit_formula: row.creditFormula || null,
        valuta_formula: row.valutaFormula || null,
        moneda_valuta_formula: row.monedaValutaFormula || null,
        row_order: row.rowOrder !== undefined ? row.rowOrder : index
      }));

      const { error: rowsError } = await supabase
        .from('tac_rows')
        .insert(rowsData);

      if (rowsError) {
        console.error('Error saving TAC rows:', {
          error: rowsError,
          message: rowsError?.message || 'No message',
          code: rowsError?.code || 'No code',
          details: rowsError?.details || 'No details',
          hint: rowsError?.hint || 'No hint',
          fullError: JSON.stringify(rowsError, null, 2),
          attemptedRows: rowsData.slice(0, 3) // Show first 3 rows for debugging
        });
        return null;
      }
    }

    return tacId;
  } catch (err) {
    console.error('Unexpected error saving TAC:', err);
    return null;
  }
}

export async function updateTAC(id: number, tac: Omit<TAC, 'id' | 'createdAt' | 'updatedAt'>, rows: Omit<TACRow, 'id' | 'tacId'>[]): Promise<boolean> {
  if (!checkSupabaseConfig()) {
    return false;
  }

  try {
    // Update TAC
    const tacData = {
      name: tac.name,
      description: tac.description || null
    };

    const { error: tacError } = await supabase
      .from('tacs')
      .update(tacData)
      .eq('id', id);

    if (tacError) {
      console.error('Error updating TAC:', {
        error: tacError,
        message: tacError?.message || 'No message',
        code: tacError?.code || 'No code',
        details: tacError?.details || 'No details',
        hint: tacError?.hint || 'No hint',
        fullError: JSON.stringify(tacError, null, 2)
      });
      return false;
    }

    // Delete existing rows
    const { error: deleteError } = await supabase
      .from('tac_rows')
      .delete()
      .eq('tac_id', id);

    if (deleteError) {
      console.error('Error deleting existing TAC rows:', {
        error: deleteError,
        message: deleteError?.message || 'No message',
        code: deleteError?.code || 'No code',
        details: deleteError?.details || 'No details',
        hint: deleteError?.hint || 'No hint'
      });
      // Continue anyway - might be able to insert new rows
    }

    // Insert new rows
    if (rows.length > 0) {
      const rowsData = rows.map((row, index) => ({
        tac_id: id,
        fisa_cont: row.fisaCont,
        cont_corespondent: row.contCorespondent || null,
        debit_formula: row.debitFormula || null,
        credit_formula: row.creditFormula || null,
        valuta_formula: row.valutaFormula || null,
        moneda_valuta_formula: row.monedaValutaFormula || null,
        row_order: row.rowOrder !== undefined ? row.rowOrder : index
      }));

      const { error: rowsError } = await supabase
        .from('tac_rows')
        .insert(rowsData);

      if (rowsError) {
        console.error('Error saving TAC rows:', {
          error: rowsError,
          message: rowsError?.message || 'No message',
          code: rowsError?.code || 'No code',
          details: rowsError?.details || 'No details',
          hint: rowsError?.hint || 'No hint',
          fullError: JSON.stringify(rowsError, null, 2),
          attemptedRows: rowsData.slice(0, 3) // Show first 3 rows for debugging
        });
        return false;
      }
    }

    return true;
  } catch (err) {
    console.error('Unexpected error updating TAC:', err);
    if (err instanceof Error) {
      console.error('Error message:', err.message);
      console.error('Error stack:', err.stack);
    }
    return false;
  }
}

export async function deleteTAC(id: number): Promise<boolean> {
  if (!checkSupabaseConfig()) {
    return false;
  }

  const { error } = await supabase
    .from('tacs')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting TAC:', error);
    return false;
  }

  return true;
}

// Transaction Functions
export async function getTransactions(): Promise<Transaction[]> {
  if (!checkSupabaseConfig()) {
    return [];
  }
  
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('transaction_date', { ascending: false });

    if (error) {
      // Check if table doesn't exist
      const errorMessage = error.message || String(error);
      const errorCode = error.code || '';
      
      if (errorCode === 'PGRST116' || errorCode === '42P01' || errorMessage?.includes('relation') || errorMessage?.includes('does not exist')) {
        console.warn('Transactions table does not exist yet. Please run the SQL schema in Supabase.');
        return [];
      }
      
      console.error('Error fetching transactions:', {
        error: error,
        message: error?.message || 'No message',
        code: error?.code || 'No code',
        details: error?.details || 'No details',
        hint: error?.hint || 'No hint',
        fullError: JSON.stringify(error, null, 2)
      });
      return [];
    }

    if (!data) return [];

    return data.map((row: any) => ({
      id: row.id,
      tacId: row.tac_id,
      transactionDate: row.transaction_date,
      description: row.description,
      variables: row.variables || {}
    }));
  } catch (err) {
    console.error('Unexpected error fetching transactions:', err);
    return [];
  }
}

export async function saveTransaction(transaction: Omit<Transaction, 'id'>): Promise<number | null> {
  if (!checkSupabaseConfig()) {
    return null;
  }

  try {
    const transactionData = {
      tac_id: transaction.tacId || null,
      transaction_date: transaction.transactionDate,
      description: transaction.description || null,
      variables: transaction.variables || {}
    };

    const { data, error } = await supabase
      .from('transactions')
      .insert([transactionData])
      .select()
      .single();

    if (error) {
      // Check if table doesn't exist
      const errorMessage = error.message || String(error);
      const errorCode = error.code || '';
      
      if (errorCode === 'PGRST116' || errorCode === '42P01' || errorMessage?.includes('relation') || errorMessage?.includes('does not exist')) {
        console.error('Transactions table does not exist. Please run the SQL schema in Supabase to create the tables.');
        return null;
      }
      
      console.error('Error saving transaction:', {
        error: error,
        message: error?.message || 'No message',
        code: error?.code || 'No code',
        details: error?.details || 'No details',
        hint: error?.hint || 'No hint',
        fullError: JSON.stringify(error, null, 2)
      });
      return null;
    }

    return data?.id || null;
  } catch (err) {
    console.error('Unexpected error saving transaction:', err);
    return null;
  }
}

export async function saveTransactionsBulk(transactions: Omit<Transaction, 'id'>[]): Promise<number[]> {
  if (!checkSupabaseConfig()) {
    return [];
  }

  try {
    const transactionData = transactions.map(t => ({
      tac_id: t.tacId || null,
      transaction_date: t.transactionDate,
      description: t.description || null,
      variables: t.variables || {}
    }));

    const { data, error } = await supabase
      .from('transactions')
      .insert(transactionData)
      .select('id');

    if (error) {
      console.error('Error saving transactions:', error);
      return [];
    }

    return data?.map(row => row.id) || [];
  } catch (err) {
    console.error('Unexpected error saving transactions:', err);
    return [];
  }
}

export async function getTACByName(name: string): Promise<TAC | null> {
  if (!checkSupabaseConfig()) {
    return null;
  }
  
  try {
    const { data, error } = await supabase
      .from('tacs')
      .select('*')
      .eq('name', name)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned - this is not an error, just means TAC doesn't exist
        return null;
      }
      console.error('Error fetching TAC by name:', {
        error: error,
        message: error?.message || 'No message',
        code: error?.code || 'No code',
        details: error?.details || 'No details',
        hint: error?.hint || 'No hint',
        fullError: JSON.stringify(error, null, 2),
        searchedName: name
      });
      return null;
    }

    if (!data) return null;

    return {
      id: data.id,
      name: data.name,
      description: data.description,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  } catch (err) {
    console.error('Unexpected error fetching TAC by name:', err);
    return null;
  }
}

export async function deleteTransaction(id: number): Promise<boolean> {
  if (!checkSupabaseConfig()) {
    return false;
  }

  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting transaction:', error);
    return false;
  }

  return true;
}

// Account File Entry Functions
export async function getAccountFileEntries(transactionId?: number): Promise<AccountFileEntry[]> {
  if (!checkSupabaseConfig()) {
    return [];
  }
  
  try {
    let query = supabase
      .from('account_file_entries')
      .select('*')
      .order('fisa_cont', { ascending: true });

    if (transactionId) {
      query = query.eq('transaction_id', transactionId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching account file entries:', error);
      return [];
    }

    if (!data) return [];

    return data.map((row: any) => ({
      id: row.id,
      transactionId: row.transaction_id,
      fisaCont: row.fisa_cont,
      contCorespondent: row.cont_corespondent,
      debit: parseFloat(row.debit) || 0,
      credit: parseFloat(row.credit) || 0,
      valuta: row.valuta ? parseFloat(row.valuta) : undefined,
      monedaValuta: row.moneda_valuta
    }));
  } catch (err) {
    console.error('Unexpected error fetching account file entries:', err);
    return [];
  }
}

export async function saveAccountFileEntries(entries: Omit<AccountFileEntry, 'id'>[]): Promise<boolean> {
  if (!checkSupabaseConfig()) {
    return false;
  }

  try {
    const rowsData = entries.map(entry => ({
      transaction_id: entry.transactionId,
      fisa_cont: entry.fisaCont,
      cont_corespondent: entry.contCorespondent || null,
      debit: entry.debit,
      credit: entry.credit,
      valuta: entry.valuta || null,
      moneda_valuta: entry.monedaValuta || null
    }));

    const { error } = await supabase
      .from('account_file_entries')
      .insert(rowsData);

    if (error) {
      console.error('Error saving account file entries:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Unexpected error saving account file entries:', err);
    return false;
  }
}