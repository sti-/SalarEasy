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

// TAC and Transaction functionality has been removed