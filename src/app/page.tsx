'use client';

import { useState, useEffect } from 'react';
import { supabase } from "@/lib/supabase";
import { lookupDeducerePercentage } from './utils/deducereLookup';
import { getEmployees, saveEmployees, getLegalSettings, getWorkingDays, type Employee, type LegalSettings, type WorkingDaysData } from '../lib/db';

// Number of non-frozen (scrollable/paged) columns that exist in total.
// Currently we have 6 real dynamic column pages plus 1 empty page at the start,
// so pagination can show seven pages of 5 columns each.
const DYNAMIC_COLUMN_COUNT = 35;
const COLUMNS_PER_PAGE = 5;     // number of non-frozen columns per page

export default function Home() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [editingCell, setEditingCell] = useState<{ id: number; field: string } | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [defaultTichetValue, setDefaultTichetValue] = useState<number>(40);
  const [defaultIndemnizatieCoMedical, setDefaultIndemnizatieCoMedical] = useState<number | null>(null);
  const [defaultIndemnizatieCoOdihna, setDefaultIndemnizatieCoOdihna] = useState<number | null>(null);
  const [defaultSalariuCIM, setDefaultSalariuCIM] = useState<number>(4050);
  const [salariulMinimPeEconomie, setSalariulMinimPeEconomie] = useState<number>(4050);
  const [deducereMinorInIntretinere, setDeducereMinorInIntretinere] = useState<number>(100);
  const [deducerePentruTineri, setDeducerePentruTineri] = useState<number>(607.5);
  const [sumaScutitaDeTaxe, setSumaScutitaDeTaxe] = useState<number>(300);
  const [casValue, setCasValue] = useState<number>(0.25);
  const [cassValue, setCassValue] = useState<number>(0.10);
  const [cotaImpozit, setCotaImpozit] = useState<number>(0.10);
  const [camValue, setCamValue] = useState<number>(0.0225);
  const [columnPage, setColumnPage] = useState(0);

  // Current month (Romanian) and year, to be reused in further logic
  const MONTHS_RO = [
    'Ianuarie',
    'Februarie',
    'Martie',
    'Aprilie',
    'Mai',
    'Iunie',
    'Iulie',
    'August',
    'Septembrie',
    'Octombrie',
    'Noiembrie',
    'Decembrie'
  ];
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  
  const currentMonthRo = MONTHS_RO[selectedMonth];
  const currentYear = selectedYear;
  const currentMonthNumber = selectedMonth + 1;

  const totalColumnPages = Math.max(1, Math.ceil(DYNAMIC_COLUMN_COUNT / COLUMNS_PER_PAGE));
  const canPrevColumns = columnPage > 0;
  const canNextColumns = columnPage < totalColumnPages - 1;

  const [workingDaysCurrentMonth, setWorkingDaysCurrentMonth] = useState<number | null>(null);

  useEffect(() => {
    async function loadData() {
      // Load employees
      const employeesData = await getEmployees();
      setEmployees(employeesData);

      // Load legal settings
      const legalSettings = await getLegalSettings();
      const tichetDefault = legalSettings['Valoare tichet de masa - default clienti BONO']?.currentValue 
        ?? legalSettings['Valoare tichet de masa']?.currentValue
        ?? 40;
      setDefaultTichetValue(tichetDefault);

      const indemnizatieCoMedicalDefault =
        typeof legalSettings['Indemnizatie CO medical']?.currentValue === 'number'
          ? legalSettings['Indemnizatie CO medical'].currentValue
          : null;
      setDefaultIndemnizatieCoMedical(indemnizatieCoMedicalDefault);

      const indemnizatieCoOdihnaDefault =
        typeof legalSettings['Indemnizatie CO odihna']?.currentValue === 'number'
          ? legalSettings['Indemnizatie CO odihna'].currentValue
          : null;
      setDefaultIndemnizatieCoOdihna(indemnizatieCoOdihnaDefault);

      const salariuCIMDefault =
        typeof legalSettings['Salariul CIM clienti Bono']?.currentValue === 'number'
          ? legalSettings['Salariul CIM clienti Bono'].currentValue
          : 4050;
      setDefaultSalariuCIM(salariuCIMDefault);

      const salariulMinimDefault =
        typeof legalSettings['Salariul minim pe economie']?.currentValue === 'number'
          ? legalSettings['Salariul minim pe economie'].currentValue
          : 4050;
      setSalariulMinimPeEconomie(salariulMinimDefault);

      const deducereMinorDefault =
        typeof legalSettings['Deducere / minor in intretinere']?.currentValue === 'number'
          ? legalSettings['Deducere / minor in intretinere'].currentValue
          : 100;
      setDeducereMinorInIntretinere(deducereMinorDefault);

      const deducerePentruTineriDefault =
        typeof legalSettings['Deducere pentru tineri <26 ani']?.currentValue === 'number'
          ? legalSettings['Deducere pentru tineri <26 ani'].currentValue
          : 607.5;
      setDeducerePentruTineri(deducerePentruTineriDefault);

      const sumaScutitaDeTaxeDefault =
        typeof legalSettings['Suma scutita de taxe']?.currentValue === 'number'
          ? legalSettings['Suma scutita de taxe'].currentValue
          : 300;
      setSumaScutitaDeTaxe(sumaScutitaDeTaxeDefault);

      const casDefault =
        typeof legalSettings['CAS']?.currentValue === 'number'
          ? legalSettings['CAS'].currentValue
          : 0.25;
      setCasValue(casDefault);

      const cassDefault =
        typeof legalSettings['CASS']?.currentValue === 'number'
          ? legalSettings['CASS'].currentValue
          : 0.10;
      setCassValue(cassDefault);

      const cotaImpozitDefault =
        typeof legalSettings['Cota impozit']?.currentValue === 'number'
          ? legalSettings['Cota impozit'].currentValue
          : 0.10;
      setCotaImpozit(cotaImpozitDefault);

      const camDefault =
        typeof legalSettings['CAM']?.currentValue === 'number'
          ? legalSettings['CAM'].currentValue
          : 0.0225;
      setCamValue(camDefault);

      // Load working days
      const workingDaysData = await getWorkingDays();
      const days = workingDaysData?.[currentYear.toString()]?.[currentMonthNumber] ?? null;
      setWorkingDaysCurrentMonth(typeof days === 'number' ? days : null);
    }

    loadData();
  }, [currentYear, currentMonthNumber]);

  // Recalculate and save rounded values when workingDaysCurrentMonth or defaultSalariuCIM changes
  useEffect(() => {
    async function recalculateAndSave() {
      if (employees.length > 0 && defaultSalariuCIM) {
        const updatedEmployees = employees.map(emp => {
          const updated = { ...emp };
          
          // Calculate and save rounded values for the three columns
          // Sal brut cf. zile lucrate (rounded)
          const salariuCIM = updated.salariuCIM ?? defaultSalariuCIM;
          const zileMed = updated.zileCOMedical ?? 0;
          const zileOdihna = updated.zileCOOdihna ?? 0;
          const zileLucrate = workingDaysCurrentMonth != null
            ? Math.max(0, workingDaysCurrentMonth - zileMed - zileOdihna)
            : 0;
          
          if (workingDaysCurrentMonth != null && workingDaysCurrentMonth > 0) {
            updated.salBrutCfZileLucrateRounded = Math.round(salariuCIM * (zileLucrate / workingDaysCurrentMonth));
          } else {
            updated.salBrutCfZileLucrateRounded = null;
          }
          
          // Indem. CO medical (rounded)
          const zileCOMed = updated.zileCOMedical ?? 0;
          const indemnizatieZiCOMed = updated.indemnizatieZiCOMedical ?? 0;
          updated.indemCOMedicalRounded = Math.round(zileCOMed * indemnizatieZiCOMed);
          
          // Indem. CO odihna (rounded)
          const zileCOOdihna = updated.zileCOOdihna ?? 0;
          const indemnizatieZiCOOdihna = updated.indemnizatieZiCOOdihna ?? 0;
          updated.indemCOOdihnaRounded = Math.round(zileCOOdihna * indemnizatieZiCOOdihna);
          
          return updated;
        });
        setEmployees(updatedEmployees);
        await saveEmployees(updatedEmployees);
      }
    }
    recalculateAndSave();
  }, [workingDaysCurrentMonth, defaultSalariuCIM]);

  const handleCellClick = (id: number, field: string, currentValue: string | number) => {
    setEditingCell({ id, field });
    setEditValue(currentValue.toString());
  };

  const handleSaveCell = async () => {
    if (!editingCell) return;

    const updatedEmployees = employees.map(emp => {
      if (emp.id === editingCell.id) {
        const updated = { ...emp };
        if (editingCell.field === 'principalLocMunca') {
          updated[editingCell.field] = editValue;
        } else {
          const numericFloatFields = [
            'valoareTichetDeMasa',
            'zileCOMedical',
            'indemnizatieZiCOMedical',
            'zileCOOdihna',
            'indemnizatieZiCOOdihna',
            'salariuCIM'
          ];
          // If editValue is empty or whitespace, treat as 0
          const trimmedValue = editValue.trim();
          let numericValue: number;
          if (trimmedValue === '') {
            numericValue = 0;
          } else {
            numericValue = numericFloatFields.includes(editingCell.field)
              ? parseFloat(trimmedValue)
              : parseInt(trimmedValue);
            // If parsing fails, default to 0
            if (isNaN(numericValue)) {
              numericValue = 0;
            }
          }
          updated[editingCell.field as keyof Employee] = numericValue as any;

          // When VALOARE TICHET DE MASA is input, auto-update ticheteDeMasa
          if (editingCell.field === 'valoareTichetDeMasa') {
            if (numericValue > 0) {
              // If a positive, non-zero value is entered, set ticheteDeMasa = DA
              updated.ticheteDeMasa = 'DA';
            } else {
              // If value is deleted or set to zero, set ticheteDeMasa = NU
              updated.ticheteDeMasa = 'NU';
              // Also set valoareTichetDeMasa to 0
              updated.valoareTichetDeMasa = 0;
            }
          }

          // When ZILE CO MEDICAL is input, auto-fill or clear Indemnizatie / zi CO medical
          if (editingCell.field === 'zileCOMedical') {
            if (numericValue === 0) {
              // If Zile CO Medical is 0 or empty, clear Indemnizatie / zi CO medical
              updated.indemnizatieZiCOMedical = 0;
            } else if (defaultIndemnizatieCoMedical != null) {
              // If Zile CO Medical has a value, auto-fill Indemnizatie / zi CO medical
              updated.indemnizatieZiCOMedical = defaultIndemnizatieCoMedical;
            }
          }

          // When ZILE CO ODIHNA is input, auto-fill or clear Indemnizatie / zi CO odihna
          if (editingCell.field === 'zileCOOdihna') {
            if (numericValue === 0) {
              // If Zile CO Odihna is 0 or empty, clear Indemnizatie / zi CO odihna
              updated.indemnizatieZiCOOdihna = 0;
            } else if (defaultIndemnizatieCoOdihna != null) {
              // If Zile CO Odihna has a value, auto-fill Indemnizatie / zi CO odihna
              updated.indemnizatieZiCOOdihna = defaultIndemnizatieCoOdihna;
            }
          }
        }
        
        // Calculate and save rounded values for the three columns
        // Sal brut cf. zile lucrate (rounded)
        const salariuCIM = updated.salariuCIM ?? defaultSalariuCIM;
        const zileMed = updated.zileCOMedical ?? 0;
        const zileOdihna = updated.zileCOOdihna ?? 0;
        const zileLucrate = workingDaysCurrentMonth != null
          ? Math.max(0, workingDaysCurrentMonth - zileMed - zileOdihna)
          : 0;
        
        if (workingDaysCurrentMonth != null && workingDaysCurrentMonth > 0) {
          updated.salBrutCfZileLucrateRounded = Math.round(salariuCIM * (zileLucrate / workingDaysCurrentMonth));
        } else {
          updated.salBrutCfZileLucrateRounded = null;
        }
        
        // Indem. CO medical (rounded)
        const zileCOMed = updated.zileCOMedical ?? 0;
        const indemnizatieZiCOMed = updated.indemnizatieZiCOMedical ?? 0;
        updated.indemCOMedicalRounded = Math.round(zileCOMed * indemnizatieZiCOMed);
        
        // Indem. CO odihna (rounded)
        const zileCOOdihna = updated.zileCOOdihna ?? 0;
        const indemnizatieZiCOOdihna = updated.indemnizatieZiCOOdihna ?? 0;
        updated.indemCOOdihnaRounded = Math.round(zileCOOdihna * indemnizatieZiCOOdihna);
        
        return updated;
      }
      return emp;
    });

    setEmployees(updatedEmployees);
    await saveEmployees(updatedEmployees);
    setEditingCell(null);
    setEditValue('');
  };

  const handleCancelCell = () => {
    setEditingCell(null);
    setEditValue('');
  };

  return (
    <main style={{
      padding: '40px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      maxWidth: '1200px',
      margin: '0 auto'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginBottom: '32px'
      }}>
        <h1 style={{
          fontSize: '32px',
          fontWeight: '600',
          color: '#1a1a1a'
        }}>
          Lista angajati
        </h1>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <select
              value={selectedMonth}
              onChange={(e) => {
                const newMonth = parseInt(e.target.value);
                setSelectedMonth(newMonth);
              }}
              style={{
                padding: '8px 12px',
                fontSize: '16px',
                color: '#333',
                fontWeight: 500,
                border: '1px solid #ddd',
                borderRadius: '6px',
                backgroundColor: '#ffffff',
                cursor: 'pointer'
              }}
            >
              {MONTHS_RO.map((month, index) => (
                <option key={index} value={index}>
                  {month}
                </option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => {
                const newYear = parseInt(e.target.value);
                setSelectedYear(newYear);
              }}
              style={{
                padding: '8px 12px',
                fontSize: '16px',
                color: '#333',
                fontWeight: 500,
                border: '1px solid #ddd',
                borderRadius: '6px',
                backgroundColor: '#ffffff',
                cursor: 'pointer'
              }}
            >
              {Array.from({ length: 10 }, (_, i) => now.getFullYear() - 5 + i).map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
          <div style={{ fontSize: '14px', color: '#666', fontWeight: 400 }}>
            Zile lucratoare: {workingDaysCurrentMonth !== null ? workingDaysCurrentMonth : 'N/A'}
          </div>
        </div>
      </div>
      
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        overflow: 'hidden'
      }}>
        {(columnPage === 0 || columnPage > 0) && (
          <div style={{
            width: '100%',
            backgroundColor: columnPage === 0 ? '#d4edda' : '#ffd4a3',
            padding: '16px 24px',
            textAlign: 'center',
            borderBottom: columnPage === 0 ? '1px solid #c3e6cb' : '1px solid #ffc87a'
          }}>
            <h2 style={{
              fontSize: '20px',
              fontWeight: '700',
              color: '#000',
              marginTop: 0,
              marginRight: 0,
              marginBottom: 0,
              marginLeft: 0,
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}>
              {columnPage === 0 ? 'REZUMAT' : 'DETALIERE CALCULE'}
            </h2>
          </div>
        )}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          padding: '8px 16px',
          gap: 0
        }}>
          {/* First part: width of first 4 columns (Sal_ID, Nume, Companie, blank) */}
          <div style={{
            width: 'calc(120px + 200px + 200px + 80px + 96px)',
            display: 'flex',
            alignItems: 'center',
            paddingRight: '16px'
          }}>
          </div>
          {/* Second part: width of remaining 5 columns (dynamic columns) */}
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            paddingLeft: '24px',
            paddingRight: '24px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <button
                onClick={() => canPrevColumns && setColumnPage((p) => Math.max(0, p - 1))}
                disabled={!canPrevColumns}
                style={{
                  padding: '4px 8px',
                  borderRadius: '4px',
                  border: '1px solid #ddd',
                  backgroundColor: canPrevColumns ? '#ffffff' : '#f5f5f5',
                  color: canPrevColumns ? '#333' : '#aaa',
                  cursor: canPrevColumns ? 'pointer' : 'default',
                  fontSize: '14px'
                }}
              >
                ‹
              </button>
              <span style={{ fontSize: '14px', color: '#333' }}>
                Pagina coloane {columnPage + 1} / {totalColumnPages}
              </span>
              <button
                onClick={() => canNextColumns && setColumnPage((p) => Math.min(totalColumnPages - 1, p + 1))}
                disabled={!canNextColumns}
                style={{
                  padding: '4px 8px',
                  borderRadius: '4px',
                  border: '1px solid #ddd',
                  backgroundColor: canNextColumns ? '#ffffff' : '#f5f5f5',
                  color: canNextColumns ? '#333' : '#aaa',
                  cursor: canNextColumns ? 'pointer' : 'default',
                  fontSize: '14px'
                }}
              >
                ›
              </button>
            </div>
          </div>
        </div>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse'
        }}>
          <thead>
            <tr style={{
              backgroundColor: '#f5f5f5',
              borderBottom: '2px solid #e0e0e0'
            }}>
              <th style={{
                padding: '16px 24px',
                textAlign: 'left',
                fontWeight: '600',
                color: '#333',
                fontSize: '14px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                borderRight: '2px solid #e0e0e0'
              }}>
                Sal_ID
              </th>
              <th style={{
                padding: '16px 24px',
                textAlign: 'left',
                fontWeight: '600',
                color: '#333',
                fontSize: '14px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                borderRight: '2px solid #e0e0e0'
              }}>
                Nume
              </th>
              <th style={{
                padding: '16px 24px',
                textAlign: 'left',
                fontWeight: '600',
                color: '#333',
                fontSize: '14px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                borderRight: '2px solid #e0e0e0'
              }}>
                Companie
              </th>
              <th style={{
                padding: '16px 24px',
                borderRight: '2px solid #e0e0e0'
              }}>
                {/* Blank column */}
              </th>
              <th style={{
                padding: '16px 24px',
                textAlign: 'left',
                fontWeight: '600',
                color: '#333',
                fontSize: '14px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                borderRight: '1px solid #e0e0e0'
              }}>
                {columnPage === 0 ? 'Salariu net' : columnPage === 1 ? 'Functia de baza' : columnPage === 2 ? 'Zile CO Medical' : columnPage === 3 ? 'Salariu CIM' : columnPage === 4 ? 'Scutire de taxe' : columnPage === 5 ? 'CASS Tichete de masa' : columnPage === 6 ? 'Deducere pentru tineri <26 ani' : ''}
              </th>
              <th style={{
                padding: '16px 24px',
                textAlign: 'left',
                fontWeight: '600',
                color: '#333',
                fontSize: '14px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                borderRight: '1px solid #e0e0e0'
              }}>
                {columnPage === 0 ? 'CAS' : columnPage === 1 ? 'Valoare tichet de masa' : columnPage === 2 ? 'Indemnizatie / zi CO medical' : columnPage === 3 ? 'Sal brut cf. zile lucrate' : columnPage === 4 ? 'Bază de calcul contribuții' : columnPage === 5 ? 'Venit impozabil înainte de deduceri' : columnPage === 6 ? 'Venit impozabil dupa deduceri' : ''}
              </th>
              <th style={{
                padding: '16px 24px',
                textAlign: 'left',
                fontWeight: '600',
                color: '#333',
                fontSize: '14px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                borderRight: '1px solid #e0e0e0'
              }}>
                {columnPage === 0 ? 'CASS (incl. Tichete)' : columnPage === 1 ? 'Persoane in intretinere' : columnPage === 2 ? 'Zile CO Odihna' : columnPage === 3 ? 'Indem. CO medical' : columnPage === 4 ? 'CAS' : columnPage === 5 ? 'Deducere %' : columnPage === 6 ? 'Impozit pe venit' : ''}
              </th>
              <th style={{
                padding: '16px 24px',
                textAlign: 'left',
                fontWeight: '600',
                color: '#333',
                fontSize: '14px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                borderRight: '1px solid #e0e0e0'
              }}>
                {columnPage === 0 ? 'Impozit' : columnPage === 1 ? 'Minori in intretinere' : columnPage === 2 ? 'Indemnizatie / zi CO odihna' : columnPage === 3 ? 'Indem. CO odihna' : columnPage === 4 ? 'CASS' : columnPage === 5 ? 'Deducere personala' : columnPage === 6 ? 'Salariu net' : ''}
              </th>
              <th style={{
                padding: '16px 24px',
                textAlign: 'left',
                fontWeight: '600',
                color: '#333',
                fontSize: '14px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                {columnPage === 0 ? 'CAM' : columnPage === 1 ? 'Varsta' : columnPage === 2 ? 'Zile lucrate' : columnPage === 3 ? 'Total Venituri Brute' : columnPage === 4 ? 'Tichete de masa' : columnPage === 5 ? 'Deducere minori' : columnPage === 6 ? 'CAM' : ''}
              </th>
            </tr>
          </thead>
          <tbody>
            {employees.length === 0 ? (
              <tr style={{
                borderBottom: '1px solid #f0f0f0'
              }}>
                <td colSpan={9} style={{
                  padding: '40px',
                  textAlign: 'center',
                  color: '#808080',
                  fontSize: '16px'
                }}>
                  No employees yet
                </td>
              </tr>
            ) : (
              employees.map((employee, index) => {
                const isEditingPrincipal = editingCell?.id === employee.id && editingCell?.field === 'principalLocMunca';
                const isEditingPersoane = editingCell?.id === employee.id && editingCell?.field === 'persoaneIntretinere';
                const isEditingMinori = editingCell?.id === employee.id && editingCell?.field === 'dinCareMinori';
                const isEditingVarsta = editingCell?.id === employee.id && editingCell?.field === 'varsta';
                const isEditingTichet = editingCell?.id === employee.id && editingCell?.field === 'valoareTichetDeMasa';
                const isEditingZileCOMed = editingCell?.id === employee.id && editingCell?.field === 'zileCOMedical';
                const isEditingIndemnCOMed = editingCell?.id === employee.id && editingCell?.field === 'indemnizatieZiCOMedical';
                const isEditingZileCOOdihna = editingCell?.id === employee.id && editingCell?.field === 'zileCOOdihna';
                const isEditingIndemnCOOdihna = editingCell?.id === employee.id && editingCell?.field === 'indemnizatieZiCOOdihna';
                const isEditingSalariuCIM = editingCell?.id === employee.id && editingCell?.field === 'salariuCIM';

                return (
                  <tr 
                    key={employee.id}
                    style={{
                      borderBottom: '1px solid #f0f0f0',
                      backgroundColor: index % 2 === 0 ? '#ffffff' : '#fafafa'
                    }}
                  >
                    <td style={{
                      padding: '16px 24px',
                      color: '#333',
                      fontSize: '15px',
                      borderRight: '2px solid #e0e0e0'
                    }}>
                      {employee.uniqueId || `IDS_${employee.id}`}
                    </td>
                    <td style={{
                      padding: '16px 24px',
                      color: '#333',
                      fontSize: '15px',
                      borderRight: '2px solid #e0e0e0'
                    }}>
                      {employee.nume}
                    </td>
                    <td style={{
                      padding: '16px 24px',
                      color: '#333',
                      fontSize: '15px',
                      borderRight: '2px solid #e0e0e0'
                    }}>
                      {employee.companie}
                    </td>
                    <td style={{
                      padding: '16px 24px',
                      borderRight: '2px solid #e0e0e0'
                    }}>
                      {/* Blank column */}
                    </td>
                    {/* Dynamic columns: page 1 shows employment fields, page 2 shows CO fields, page 3 is empty */}
                    {columnPage === 0 ? (
                      <>
                        {/* Page 0: Salariu net (summary) */}
                        {(() => {
                          // Use saved rounded values from DB
                          const salBrutCfZileLucrate = employee.salBrutCfZileLucrateRounded ?? 0;
                          const indemCOMedical = employee.indemCOMedicalRounded ?? 0;
                          const indemCOOdihna = employee.indemCOOdihnaRounded ?? 0;
                          
                          const totalVenituriBrute = salBrutCfZileLucrate + indemCOMedical + indemCOOdihna;
                          
                          // Calculate Scutire de taxe
                          const scutireDeTaxe = employee.principalLocMunca === 'NU' 
                            ? 0 
                            : (totalVenituriBrute <= 4300 ? sumaScutitaDeTaxe : 0);
                          
                          // Calculate Bază de calcul contribuții (rounded)
                          const bazaDeCalculContributii = Math.round(totalVenituriBrute - scutireDeTaxe);
                          
                          // Calculate CAS (rounded)
                          const cas = Math.round(bazaDeCalculContributii * casValue);
                          
                          // Calculate CASS (rounded)
                          const cass = Math.round(bazaDeCalculContributii * cassValue);
                          
                          // Calculate zileLucrate for Tichete de masa calculation
                          const zileMed = employee.zileCOMedical ?? 0;
                          const zileOdihna = employee.zileCOOdihna ?? 0;
                          const zileLucrate = workingDaysCurrentMonth != null
                            ? Math.max(0, workingDaysCurrentMonth - zileMed - zileOdihna)
                            : 0;
                          
                          // Calculate Tichete de masa (rounded)
                          let ticheteDeMasa = 0;
                          if (employee.ticheteDeMasa === 'DA') {
                            const valoareTichetDeMasa = employee.valoareTichetDeMasa ?? defaultTichetValue;
                            ticheteDeMasa = (zileLucrate > 0)
                              ? Math.round(zileLucrate * valoareTichetDeMasa)
                              : 0;
                          }
                          
                          // Calculate CASS Tichete de masa (rounded)
                          const cassTicheteDeMasa = Math.round(ticheteDeMasa * cassValue);
                          
                          // Calculate Venit impozabil înainte de deduceri (using rounded values)
                          const venitImpozabilInainteDeDeduceri = bazaDeCalculContributii - cas - cass - cassTicheteDeMasa + ticheteDeMasa;
                          
                          // Calculate Deducere personala
                          let deducerePersonala = 0;
                          if (employee.principalLocMunca === 'DA') {
                            const venitPtCalculDeducere = totalVenituriBrute + ticheteDeMasa;
                            const numDependents = employee.persoaneIntretinere ?? 0;
                            const deducerePercentage = lookupDeducerePercentage(venitPtCalculDeducere, numDependents);
                            deducerePersonala = deducerePercentage !== null
                              ? Math.round((deducerePercentage / 100) * salariulMinimPeEconomie)
                              : 0;
                          }
                          
                          // Calculate Deducere minori
                          let deducereMinori = 0;
                          if (employee.principalLocMunca === 'DA') {
                            const minoriInIntretinere = employee.dinCareMinori ?? 0;
                            deducereMinori = Math.round(minoriInIntretinere * deducereMinorInIntretinere);
                          }
                          
                          // Calculate Deducere pentru tineri <26 ani
                          let deducerePentruTineriVal = 0;
                          if (employee.principalLocMunca === 'DA') {
                            const varsta = employee.varsta ?? 0;
                            deducerePentruTineriVal = varsta < 26 ? Math.round(deducerePentruTineri) : 0;
                          }
                          
                          // Calculate Venit impozabil dupa deduceri = Rounded(Venit impozabil înainte de deduceri) - Rounded(Deducere personala) - Rounded(Deducere minori) - Rounded(Deducere pentru tineri <26 ani)
                          const venitImpozabilDupaDeduceri = venitImpozabilInainteDeDeduceri - deducerePersonala - deducereMinori - deducerePentruTineriVal;
                          
                          // Calculate Impozit pe venit (rounded)
                          const impozitPeVenit = Math.round(venitImpozabilDupaDeduceri * cotaImpozit);
                          
                          // Calculate Salariu net = Rounded(Total Venituri Brute) - Rounded(CAS) - Rounded(CASS) - Rounded(Impozit pe venit) - Rounded(CASS Tichete de masa)
                          const salariuNet = totalVenituriBrute - cas - cass - impozitPeVenit - cassTicheteDeMasa;
                          
                          // Calculate CASS (incl. Tichete) = CASS + CASS Tichete de masa
                          const cassInclTichete = cass + cassTicheteDeMasa;
                          
                          // Calculate CAM (rounded)
                          const cam = Math.round(bazaDeCalculContributii * camValue);
                          
                          return (
                            <>
                              {/* Column 1: Salariu net */}
                              <td style={{
                                padding: '16px 24px',
                                color: '#333',
                                fontSize: '15px',
                                borderRight: '1px solid #e0e0e0'
                              }}>
                                {salariuNet === 0 ? '' : salariuNet}
                              </td>
                              {/* Column 2: CAS */}
                              <td style={{
                                padding: '16px 24px',
                                color: '#333',
                                fontSize: '15px',
                                borderRight: '1px solid #e0e0e0'
                              }}>
                                {cas === 0 ? '' : cas}
                              </td>
                              {/* Column 3: CASS (incl. Tichete) */}
                              <td style={{
                                padding: '16px 24px',
                                color: '#333',
                                fontSize: '15px',
                                borderRight: '1px solid #e0e0e0'
                              }}>
                                {cassInclTichete === 0 ? '' : cassInclTichete}
                              </td>
                              {/* Column 4: Impozit */}
                              <td style={{
                                padding: '16px 24px',
                                color: '#333',
                                fontSize: '15px',
                                borderRight: '1px solid #e0e0e0'
                              }}>
                                {impozitPeVenit === 0 ? '' : impozitPeVenit}
                              </td>
                              {/* Column 5: CAM */}
                              <td style={{
                                padding: '16px 24px',
                                color: '#333',
                                fontSize: '15px'
                              }}>
                                {cam === 0 ? '' : cam}
                              </td>
                            </>
                          );
                        })()}
                      </>
                    ) : columnPage === 1 ? (
                      <>
                        <td 
                          style={{
                            padding: '16px 24px',
                            color: '#333',
                            fontSize: '15px',
                            borderRight: '1px solid #e0e0e0',
                            cursor: 'pointer'
                          }}
                          onClick={() => !isEditingPrincipal && handleCellClick(employee.id, 'principalLocMunca', employee.principalLocMunca)}
                        >
                          {isEditingPrincipal ? (
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <select
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              onBlur={handleSaveCell}
                              autoFocus
                              style={{
                                padding: '6px 10px',
                                border: '1px solid #D66185',
                                borderRadius: '4px',
                                fontSize: '14px'
                              }}
                            >
                              <option value="NU">NU</option>
                              <option value="DA">DA</option>
                            </select>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSaveCell();
                              }}
                              style={{
                                padding: '4px 10px',
                                backgroundColor: '#D66185',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '12px'
                              }}
                            >
                              ✓
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCancelCell();
                              }}
                              style={{
                                padding: '4px 10px',
                                backgroundColor: '#f5f5f5',
                                color: '#333',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '12px'
                              }}
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          employee.principalLocMunca
                        )}
                        </td>
                        <td 
                          style={{
                            padding: '16px 24px',
                            color: '#333',
                            fontSize: '15px',
                            borderRight: '1px solid #e0e0e0',
                            cursor: 'pointer'
                          }}
                          onClick={() => {
                            // If ticheteDeMasa = NU, display 0, otherwise use the value or default
                            const displayValue = employee.ticheteDeMasa === 'NU' 
                              ? 0 
                              : (employee.valoareTichetDeMasa ?? defaultTichetValue);
                            if (!isEditingTichet) {
                              handleCellClick(employee.id, 'valoareTichetDeMasa', displayValue);
                            }
                          }}
                        >
                          {isEditingTichet ? (
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <input
                              type="number"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              style={{
                                padding: '6px 10px',
                                border: '1px solid #D66185',
                                borderRadius: '4px',
                                fontSize: '14px',
                                width: '80px'
                              }}
                              min="0"
                              step="0.01"
                              autoFocus
                            />
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSaveCell();
                              }}
                              style={{
                                padding: '4px 10px',
                                backgroundColor: '#D66185',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '12px'
                              }}
                            >
                              ✓
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCancelCell();
                              }}
                              style={{
                                padding: '4px 10px',
                                backgroundColor: '#f5f5f5',
                                color: '#333',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '12px'
                              }}
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          // If ticheteDeMasa = NU, display 0, otherwise use the value or default
                          employee.ticheteDeMasa === 'NU' 
                            ? 0 
                            : (employee.valoareTichetDeMasa ?? defaultTichetValue)
                        )}
                        </td>
                        <td 
                          style={{
                            padding: '16px 24px',
                            color: '#333',
                            fontSize: '15px',
                            borderRight: '1px solid #e0e0e0',
                            cursor: 'pointer'
                          }}
                          onClick={() => !isEditingPersoane && handleCellClick(employee.id, 'persoaneIntretinere', employee.persoaneIntretinere)}
                        >
                          {isEditingPersoane ? (
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <input
                              type="number"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              style={{
                                padding: '6px 10px',
                                border: '1px solid #D66185',
                                borderRadius: '4px',
                                fontSize: '14px',
                                width: '80px'
                              }}
                              min="0"
                              autoFocus
                            />
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSaveCell();
                              }}
                              style={{
                                padding: '4px 10px',
                                backgroundColor: '#D66185',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '12px'
                              }}
                            >
                              ✓
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCancelCell();
                              }}
                              style={{
                                padding: '4px 10px',
                                backgroundColor: '#f5f5f5',
                                color: '#333',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '12px'
                              }}
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          employee.persoaneIntretinere
                        )}
                        </td>
                        <td 
                          style={{
                            padding: '16px 24px',
                            color: '#333',
                            fontSize: '15px',
                            borderRight: '1px solid #e0e0e0',
                            cursor: 'pointer'
                          }}
                          onClick={() => !isEditingMinori && handleCellClick(employee.id, 'dinCareMinori', employee.dinCareMinori)}
                        >
                          {isEditingMinori ? (
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <input
                              type="number"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              style={{
                                padding: '6px 10px',
                                border: '1px solid #D66185',
                                borderRadius: '4px',
                                fontSize: '14px',
                                width: '80px'
                              }}
                              min="0"
                              autoFocus
                            />
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSaveCell();
                              }}
                              style={{
                                padding: '4px 10px',
                                backgroundColor: '#D66185',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '12px'
                              }}
                            >
                              ✓
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCancelCell();
                              }}
                              style={{
                                padding: '4px 10px',
                                backgroundColor: '#f5f5f5',
                                color: '#333',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '12px'
                              }}
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          employee.dinCareMinori
                        )}
                        </td>
                        <td 
                          style={{
                            padding: '16px 24px',
                            color: '#333',
                            fontSize: '15px',
                            cursor: 'pointer'
                          }}
                          onClick={() => !isEditingVarsta && handleCellClick(employee.id, 'varsta', employee.varsta)}
                        >
                          {isEditingVarsta ? (
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <input
                              type="number"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              onBlur={handleSaveCell}
                              style={{
                                padding: '6px 10px',
                                border: '1px solid #D66185',
                                borderRadius: '4px',
                                fontSize: '14px',
                                width: '80px'
                              }}
                              min="0"
                              autoFocus
                            />
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSaveCell();
                              }}
                              style={{
                                padding: '4px 10px',
                                backgroundColor: '#D66185',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '12px'
                              }}
                            >
                              ✓
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCancelCell();
                              }}
                              style={{
                                padding: '4px 10px',
                                backgroundColor: '#f5f5f5',
                                color: '#333',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '12px'
                              }}
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          employee.varsta
                        )}
                        </td>
                      </>
                    ) : columnPage === 2 ? (
                      <>
                        {/* Zile CO Medical */}
                        {(() => {
                          const rawValue = employee.zileCOMedical ?? 0;
                          const displayValue = rawValue === 0 ? '' : rawValue;
                          return (
                            <td
                              style={{
                                padding: '16px 24px',
                                color: '#333',
                                fontSize: '15px',
                                borderRight: '1px solid #e0e0e0',
                                cursor: 'pointer',
                                backgroundColor: '#fff7e6'
                              }}
                              onClick={() => !isEditingZileCOMed && handleCellClick(employee.id, 'zileCOMedical', rawValue)}
                            >
                              {isEditingZileCOMed ? (
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                  <input
                                    type="number"
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    onClick={(e) => e.stopPropagation()}
                                    style={{
                                      padding: '6px 10px',
                                      border: '1px solid #D66185',
                                      borderRadius: '4px',
                                      fontSize: '14px',
                                      width: '80px'
                                    }}
                                    min="0"
                                    step="0.01"
                                    autoFocus
                                  />
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleSaveCell();
                                    }}
                                    style={{
                                      padding: '4px 10px',
                                      backgroundColor: '#D66185',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: '4px',
                                      cursor: 'pointer',
                                      fontSize: '12px'
                                    }}
                                  >
                                    ✓
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleCancelCell();
                                    }}
                                    style={{
                                      padding: '4px 10px',
                                      backgroundColor: '#f5f5f5',
                                      color: '#333',
                                      border: '1px solid #ddd',
                                      borderRadius: '4px',
                                      cursor: 'pointer',
                                      fontSize: '12px'
                                    }}
                                  >
                                    ✕
                                  </button>
                                </div>
                              ) : (
                                displayValue
                              )}
                            </td>
                          );
                        })()}

                        {/* Indemnizatie / zi CO medical */}
                        {(() => {
                          const rawValue = employee.indemnizatieZiCOMedical ?? 0;
                          const displayValue = rawValue === 0 ? '' : rawValue;
                          return (
                            <td
                              style={{
                                padding: '16px 24px',
                                color: '#333',
                                fontSize: '15px',
                                borderRight: '1px solid #e0e0e0',
                                cursor: 'pointer',
                                backgroundColor: '#fff7e6'
                              }}
                              onClick={() => !isEditingIndemnCOMed && handleCellClick(employee.id, 'indemnizatieZiCOMedical', rawValue)}
                            >
                              {isEditingIndemnCOMed ? (
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                  <input
                                    type="number"
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    onClick={(e) => e.stopPropagation()}
                                    style={{
                                      padding: '6px 10px',
                                      border: '1px solid #D66185',
                                      borderRadius: '4px',
                                      fontSize: '14px',
                                      width: '80px'
                                    }}
                                    min="0"
                                    step="0.01"
                                    autoFocus
                                  />
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleSaveCell();
                                    }}
                                    style={{
                                      padding: '4px 10px',
                                      backgroundColor: '#D66185',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: '4px',
                                      cursor: 'pointer',
                                      fontSize: '12px'
                                    }}
                                  >
                                    ✓
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleCancelCell();
                                    }}
                                    style={{
                                      padding: '4px 10px',
                                      backgroundColor: '#f5f5f5',
                                      color: '#333',
                                      border: '1px solid #ddd',
                                      borderRadius: '4px',
                                      cursor: 'pointer',
                                      fontSize: '12px'
                                    }}
                                  >
                                    ✕
                                  </button>
                                </div>
                              ) : (
                                displayValue
                              )}
                            </td>
                          );
                        })()}

                        {/* Zile CO Odihna */}
                        {(() => {
                          const rawValue = employee.zileCOOdihna ?? 0;
                          const displayValue = rawValue === 0 ? '' : rawValue;
                          return (
                            <td
                              style={{
                                padding: '16px 24px',
                                color: '#333',
                                fontSize: '15px',
                                borderRight: '1px solid #e0e0e0',
                                cursor: 'pointer',
                                backgroundColor: '#fff7e6'
                              }}
                              onClick={() => !isEditingZileCOOdihna && handleCellClick(employee.id, 'zileCOOdihna', rawValue)}
                            >
                              {isEditingZileCOOdihna ? (
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                  <input
                                    type="number"
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    onClick={(e) => e.stopPropagation()}
                                    style={{
                                      padding: '6px 10px',
                                      border: '1px solid #D66185',
                                      borderRadius: '4px',
                                      fontSize: '14px',
                                      width: '80px'
                                    }}
                                    min="0"
                                    step="0.01"
                                    autoFocus
                                  />
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleSaveCell();
                                    }}
                                    style={{
                                      padding: '4px 10px',
                                      backgroundColor: '#D66185',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: '4px',
                                      cursor: 'pointer',
                                      fontSize: '12px'
                                    }}
                                  >
                                    ✓
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleCancelCell();
                                    }}
                                    style={{
                                      padding: '4px 10px',
                                      backgroundColor: '#f5f5f5',
                                      color: '#333',
                                      border: '1px solid #ddd',
                                      borderRadius: '4px',
                                      cursor: 'pointer',
                                      fontSize: '12px'
                                    }}
                                  >
                                    ✕
                                  </button>
                                </div>
                              ) : (
                                displayValue
                              )}
                            </td>
                          );
                        })()}

                        {/* Indemnizatie / zi CO odihna */}
                        {(() => {
                          const rawValue = employee.indemnizatieZiCOOdihna ?? 0;
                          const displayValue = rawValue === 0 ? '' : rawValue;
                          return (
                            <td
                              style={{
                                padding: '16px 24px',
                                color: '#333',
                                fontSize: '15px',
                                borderRight: '1px solid #e0e0e0',
                                cursor: 'pointer',
                                backgroundColor: '#fff7e6'
                              }}
                              onClick={() => !isEditingIndemnCOOdihna && handleCellClick(employee.id, 'indemnizatieZiCOOdihna', rawValue)}
                            >
                              {isEditingIndemnCOOdihna ? (
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                  <input
                                    type="number"
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    onClick={(e) => e.stopPropagation()}
                                    style={{
                                      padding: '6px 10px',
                                      border: '1px solid #D66185',
                                      borderRadius: '4px',
                                      fontSize: '14px',
                                      width: '80px'
                                    }}
                                    min="0"
                                    step="0.01"
                                    autoFocus
                                  />
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleSaveCell();
                                    }}
                                    style={{
                                      padding: '4px 10px',
                                      backgroundColor: '#D66185',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: '4px',
                                      cursor: 'pointer',
                                      fontSize: '12px'
                                    }}
                                  >
                                    ✓
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleCancelCell();
                                    }}
                                    style={{
                                      padding: '4px 10px',
                                      backgroundColor: '#f5f5f5',
                                      color: '#333',
                                      border: '1px solid #ddd',
                                      borderRadius: '4px',
                                      cursor: 'pointer',
                                      fontSize: '12px'
                                    }}
                                  >
                                    ✕
                                  </button>
                                </div>
                              ) : (
                                displayValue
                              )}
                            </td>
                          );
                        })()}

                        {/* Zile lucrate (computed) */}
                        {(() => {
                          const zileMed = employee.zileCOMedical ?? 0;
                          const zileOdihna = employee.zileCOOdihna ?? 0;
                          const zileLucrate = workingDaysCurrentMonth != null
                            ? Math.max(0, workingDaysCurrentMonth - zileMed - zileOdihna)
                            : '';
                          return (
                            <td
                              style={{
                                padding: '16px 24px',
                                color: '#333',
                                fontSize: '15px'
                              }}
                            >
                              {zileLucrate}
                            </td>
                          );
                        })()}
                      </>
                    ) : columnPage === 3 ? (
                      <>
                        {/* Page 3: Salariu CIM (editable) */}
                        {(() => {
                          const rawValue = employee.salariuCIM ?? defaultSalariuCIM;
                          return (
                            <td
                              style={{
                                padding: '16px 24px',
                                color: '#333',
                                fontSize: '15px',
                                borderRight: '1px solid #e0e0e0',
                                cursor: 'pointer'
                              }}
                              onClick={() => !isEditingSalariuCIM && handleCellClick(employee.id, 'salariuCIM', rawValue)}
                            >
                              {isEditingSalariuCIM ? (
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                  <input
                                    type="number"
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    onClick={(e) => e.stopPropagation()}
                                    style={{
                                      padding: '6px 10px',
                                      border: '1px solid #D66185',
                                      borderRadius: '4px',
                                      fontSize: '14px',
                                      width: '80px'
                                    }}
                                    min="0"
                                    step="0.01"
                                    autoFocus
                                  />
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleSaveCell();
                                    }}
                                    style={{
                                      padding: '4px 10px',
                                      backgroundColor: '#D66185',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: '4px',
                                      cursor: 'pointer',
                                      fontSize: '12px'
                                    }}
                                  >
                                    ✓
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleCancelCell();
                                    }}
                                    style={{
                                      padding: '4px 10px',
                                      backgroundColor: '#f5f5f5',
                                      color: '#333',
                                      border: '1px solid #ddd',
                                      borderRadius: '4px',
                                      cursor: 'pointer',
                                      fontSize: '12px'
                                    }}
                                  >
                                    ✕
                                  </button>
                                </div>
                              ) : (
                                rawValue
                              )}
                            </td>
                          );
                        })()}
                        {/* Page 3: Sal brut cf. zile lucrate (auto-calculated) */}
                        {(() => {
                          const salariuCIM = employee.salariuCIM ?? defaultSalariuCIM;
                          const zileMed = employee.zileCOMedical ?? 0;
                          const zileOdihna = employee.zileCOOdihna ?? 0;
                          const zileLucrate = workingDaysCurrentMonth != null
                            ? Math.max(0, workingDaysCurrentMonth - zileMed - zileOdihna)
                            : null;
                          
                          let salBrutCfZileLucrate: number | string = '';
                          if (zileLucrate !== null && workingDaysCurrentMonth != null && workingDaysCurrentMonth > 0) {
                            salBrutCfZileLucrate = Math.round(salariuCIM * (zileLucrate / workingDaysCurrentMonth));
                          }
                          
                          return (
                            <td
                              style={{
                                padding: '16px 24px',
                                color: '#333',
                                fontSize: '15px',
                                borderRight: '1px solid #e0e0e0'
                              }}
                            >
                              {salBrutCfZileLucrate}
                            </td>
                          );
                        })()}
                        {/* Page 3: Indem. CO medical (auto-calculated) */}
                        {(() => {
                          const zileCOMed = employee.zileCOMedical ?? 0;
                          const indemnizatieZiCOMed = employee.indemnizatieZiCOMedical ?? 0;
                          const indemCOMedical = Math.round(zileCOMed * indemnizatieZiCOMed);
                          
                          return (
                            <td
                              style={{
                                padding: '16px 24px',
                                color: '#333',
                                fontSize: '15px',
                                borderRight: '1px solid #e0e0e0'
                              }}
                            >
                              {indemCOMedical === 0 ? '' : indemCOMedical}
                            </td>
                          );
                        })()}
                        {/* Page 3: Indem. CO odihna (auto-calculated) */}
                        {(() => {
                          const zileCOOdihna = employee.zileCOOdihna ?? 0;
                          const indemnizatieZiCOOdihna = employee.indemnizatieZiCOOdihna ?? 0;
                          const indemCOOdihna = Math.round(zileCOOdihna * indemnizatieZiCOOdihna);
                          
                          return (
                            <td
                              style={{
                                padding: '16px 24px',
                                color: '#333',
                                fontSize: '15px',
                                borderRight: '1px solid #e0e0e0'
                              }}
                            >
                              {indemCOOdihna === 0 ? '' : indemCOOdihna}
                            </td>
                          );
                        })()}
                        {/* Page 3: Total Venituri Brute (auto-calculated) */}
                        {(() => {
                          // Use saved rounded values from DB
                          const salBrutCfZileLucrate = employee.salBrutCfZileLucrateRounded ?? 0;
                          const indemCOMedical = employee.indemCOMedicalRounded ?? 0;
                          const indemCOOdihna = employee.indemCOOdihnaRounded ?? 0;
                          
                          // Sum all three rounded values
                          const totalVenituriBrute = salBrutCfZileLucrate + indemCOMedical + indemCOOdihna;
                          
                          return (
                            <td
                              style={{
                                padding: '16px 24px',
                                color: '#333',
                                fontSize: '15px'
                              }}
                            >
                              {totalVenituriBrute === 0 ? '' : totalVenituriBrute}
                            </td>
                          );
                        })()}
                      </>
                    ) : columnPage === 4 ? (
                      <>
                        {/* Page 4: Scutire de taxe (auto-calculated) */}
                        {(() => {
                          // Use saved rounded values from DB
                          const salBrutCfZileLucrate = employee.salBrutCfZileLucrateRounded ?? 0;
                          const indemCOMedical = employee.indemCOMedicalRounded ?? 0;
                          const indemCOOdihna = employee.indemCOOdihnaRounded ?? 0;
                          
                          const totalVenituriBrute = salBrutCfZileLucrate + indemCOMedical + indemCOOdihna;
                          
                          // Apply logic: IF "Functia de baza" = NU Then "Scutire de taxe" = 0
                          // ELSE IF Total Venituri Brute <= 4300, use sumaScutitaDeTaxe, otherwise 0
                          const scutireDeTaxe = employee.principalLocMunca === 'NU' 
                            ? 0 
                            : (totalVenituriBrute <= 4300 ? sumaScutitaDeTaxe : 0);
                          
                          return (
                            <td
                              style={{
                                padding: '16px 24px',
                                color: '#333',
                                fontSize: '15px',
                                borderRight: '1px solid #e0e0e0'
                              }}
                            >
                              {scutireDeTaxe === 0 ? '' : scutireDeTaxe}
                            </td>
                          );
                        })()}
                        {/* Page 4: Bază de calcul contribuții (auto-calculated) */}
                        {(() => {
                          // Use saved rounded values from DB
                          const salBrutCfZileLucrate = employee.salBrutCfZileLucrateRounded ?? 0;
                          const indemCOMedical = employee.indemCOMedicalRounded ?? 0;
                          const indemCOOdihna = employee.indemCOOdihnaRounded ?? 0;
                          
                          const totalVenituriBrute = salBrutCfZileLucrate + indemCOMedical + indemCOOdihna;
                          
                          // Calculate Scutire de taxe: IF "Functia de baza" = NU Then 0 ELSE IF Total Venituri Brute <= 4300, use sumaScutitaDeTaxe, otherwise 0
                          const scutireDeTaxe = employee.principalLocMunca === 'NU' 
                            ? 0 
                            : (totalVenituriBrute <= 4300 ? sumaScutitaDeTaxe : 0);
                          
                          // Calculate Bază de calcul contribuții = Total Venituri Brute - Scutire de taxe
                          const bazaDeCalculContributii = totalVenituriBrute - scutireDeTaxe;
                          
                          return (
                            <td
                              style={{
                                padding: '16px 24px',
                                color: '#333',
                                fontSize: '15px',
                                borderRight: '1px solid #e0e0e0'
                              }}
                            >
                              {bazaDeCalculContributii === 0 ? '' : bazaDeCalculContributii}
                            </td>
                          );
                        })()}
                        {/* Page 4: CAS (auto-calculated) */}
                        {(() => {
                          // Use saved rounded values from DB
                          const salBrutCfZileLucrate = employee.salBrutCfZileLucrateRounded ?? 0;
                          const indemCOMedical = employee.indemCOMedicalRounded ?? 0;
                          const indemCOOdihna = employee.indemCOOdihnaRounded ?? 0;
                          
                          const totalVenituriBrute = salBrutCfZileLucrate + indemCOMedical + indemCOOdihna;
                          
                          // Calculate Scutire de taxe: IF "Functia de baza" = NU Then 0 ELSE IF Total Venituri Brute <= 4300, use sumaScutitaDeTaxe, otherwise 0
                          const scutireDeTaxe = employee.principalLocMunca === 'NU' 
                            ? 0 
                            : (totalVenituriBrute <= 4300 ? sumaScutitaDeTaxe : 0);
                          
                          // Calculate Bază de calcul contribuții
                          const bazaDeCalculContributii = totalVenituriBrute - scutireDeTaxe;
                          
                          // Calculate CAS = ROUNDED(Bază de calcul contribuții * CAS value)
                          const cas = Math.round(bazaDeCalculContributii * casValue);
                          
                          return (
                            <td
                              style={{
                                padding: '16px 24px',
                                color: '#333',
                                fontSize: '15px',
                                borderRight: '1px solid #e0e0e0'
                              }}
                            >
                              {cas === 0 ? '' : cas}
                            </td>
                          );
                        })()}
                        {/* Page 4: CASS (auto-calculated) */}
                        {(() => {
                          // Use saved rounded values from DB
                          const salBrutCfZileLucrate = employee.salBrutCfZileLucrateRounded ?? 0;
                          const indemCOMedical = employee.indemCOMedicalRounded ?? 0;
                          const indemCOOdihna = employee.indemCOOdihnaRounded ?? 0;
                          
                          const totalVenituriBrute = salBrutCfZileLucrate + indemCOMedical + indemCOOdihna;
                          
                          // Calculate Scutire de taxe: IF "Functia de baza" = NU Then 0 ELSE IF Total Venituri Brute <= 4300, use sumaScutitaDeTaxe, otherwise 0
                          const scutireDeTaxe = employee.principalLocMunca === 'NU' 
                            ? 0 
                            : (totalVenituriBrute <= 4300 ? sumaScutitaDeTaxe : 0);
                          
                          // Calculate Bază de calcul contribuții
                          const bazaDeCalculContributii = totalVenituriBrute - scutireDeTaxe;
                          
                          // Calculate CASS = ROUNDED(Bază de calcul contribuții * CASS value)
                          const cass = Math.round(bazaDeCalculContributii * cassValue);
                          
                          return (
                            <td
                              style={{
                                padding: '16px 24px',
                                color: '#333',
                                fontSize: '15px',
                                borderRight: '1px solid #e0e0e0'
                              }}
                            >
                              {cass === 0 ? '' : cass}
                            </td>
                          );
                        })()}
                        {/* Page 4: Tichete de masa (auto-calculated) */}
                        {(() => {
                          // Only calculate if employee has meal tickets enabled
                          if (employee.ticheteDeMasa !== 'DA') {
                            return (
                        <td style={{
                                padding: '16px 24px',
                                color: '#333',
                                fontSize: '15px'
                              }}>
                              </td>
                            );
                          }
                          
                          // Calculate Zile lucrate (same logic as columnPage === 1)
                          const zileMed = employee.zileCOMedical ?? 0;
                          const zileOdihna = employee.zileCOOdihna ?? 0;
                          const zileLucrate = workingDaysCurrentMonth != null
                            ? Math.max(0, workingDaysCurrentMonth - zileMed - zileOdihna)
                            : null;
                          
                          // Get Valoare tichet de masa
                          const valoareTichetDeMasa = employee.valoareTichetDeMasa ?? defaultTichetValue;
                          
                          // Calculate Tichete de masa = Zile lucrate * Valoare tichet de masa
                          const ticheteDeMasa = (zileLucrate !== null && zileLucrate > 0)
                            ? zileLucrate * valoareTichetDeMasa
                            : '';
                          
                          return (
                            <td style={{
                              padding: '16px 24px',
                              color: '#333',
                              fontSize: '15px'
                            }}>
                              {ticheteDeMasa}
                            </td>
                          );
                        })()}
                      </>
                    ) : columnPage === 5 ? (
                      <>
                        {/* Page 5: CASS Tichete de masa (auto-calculated) */}
                        {(() => {
                          // Only calculate if employee has meal tickets enabled
                          if (employee.ticheteDeMasa !== 'DA') {
                            return (
                              <td style={{
                                padding: '16px 24px',
                                color: '#333',
                                fontSize: '15px',
                                borderRight: '1px solid #e0e0e0'
                              }}>
                              </td>
                            );
                          }
                          
                          // Calculate Zile lucrate (same logic as columnPage === 1)
                          const zileMed = employee.zileCOMedical ?? 0;
                          const zileOdihna = employee.zileCOOdihna ?? 0;
                          const zileLucrate = workingDaysCurrentMonth != null
                            ? Math.max(0, workingDaysCurrentMonth - zileMed - zileOdihna)
                            : null;
                          
                          // Get Valoare tichet de masa
                          const valoareTichetDeMasa = employee.valoareTichetDeMasa ?? defaultTichetValue;
                          
                          // Calculate Tichete de masa = Zile lucrate * Valoare tichet de masa
                          const ticheteDeMasa = (zileLucrate !== null && zileLucrate > 0)
                            ? zileLucrate * valoareTichetDeMasa
                            : 0;
                          
                          // Calculate CASS Tichete de masa = ROUNDED(Tichete de masa * CASS value)
                          const cassTicheteDeMasa = Math.round(ticheteDeMasa * cassValue);
                          
                          return (
                            <td style={{
                              padding: '16px 24px',
                              color: '#333',
                              fontSize: '15px',
                              borderRight: '1px solid #e0e0e0'
                            }}>
                              {cassTicheteDeMasa === 0 ? '' : cassTicheteDeMasa}
                            </td>
                          );
                        })()}
                        {/* Page 5: Venit impozabil înainte de deduceri (auto-calculated) */}
                        {(() => {
                          // Use saved rounded values from DB
                          const salBrutCfZileLucrate = employee.salBrutCfZileLucrateRounded ?? 0;
                          const indemCOMedical = employee.indemCOMedicalRounded ?? 0;
                          const indemCOOdihna = employee.indemCOOdihnaRounded ?? 0;
                          
                          const totalVenituriBrute = salBrutCfZileLucrate + indemCOMedical + indemCOOdihna;
                          
                          // Calculate Scutire de taxe: IF "Functia de baza" = NU Then 0 ELSE IF Total Venituri Brute <= 4300, use sumaScutitaDeTaxe, otherwise 0
                          const scutireDeTaxe = employee.principalLocMunca === 'NU' 
                            ? 0 
                            : (totalVenituriBrute <= 4300 ? sumaScutitaDeTaxe : 0);
                          
                          // Calculate Bază de calcul contribuții (rounded)
                          const bazaDeCalculContributii = Math.round(totalVenituriBrute - scutireDeTaxe);
                          
                          // Calculate CAS (rounded)
                          const cas = Math.round(bazaDeCalculContributii * casValue);
                          
                          // Calculate CASS (rounded)
                          const cass = Math.round(bazaDeCalculContributii * cassValue);
                          
                          // Calculate zileLucrate for Tichete de masa calculation
                          const zileMed = employee.zileCOMedical ?? 0;
                          const zileOdihna = employee.zileCOOdihna ?? 0;
                          const zileLucrate = workingDaysCurrentMonth != null
                            ? Math.max(0, workingDaysCurrentMonth - zileMed - zileOdihna)
                            : 0;
                          
                          // Calculate Tichete de masa (rounded)
                          let ticheteDeMasa = 0;
                          if (employee.ticheteDeMasa === 'DA') {
                            const valoareTichetDeMasa = employee.valoareTichetDeMasa ?? defaultTichetValue;
                            ticheteDeMasa = (zileLucrate > 0)
                              ? Math.round(zileLucrate * valoareTichetDeMasa)
                              : 0;
                          }
                          
                          // Calculate CASS Tichete de masa (rounded)
                          const cassTicheteDeMasa = Math.round(ticheteDeMasa * cassValue);
                          
                          // Calculate Venit impozabil înainte de deduceri = Rounded(Bază de calcul contribuții) - Rounded(CAS) - Rounded(CASS) - Rounded(CASS Tichete de masa) + Rounded(Tichete de masa)
                          const venitImpozabilInainteDeDeduceri = bazaDeCalculContributii - cas - cass - cassTicheteDeMasa + ticheteDeMasa;
                          
                          return (
                            <td style={{
                              padding: '16px 24px',
                              color: '#333',
                              fontSize: '15px',
                              borderRight: '1px solid #e0e0e0'
                            }}>
                              {venitImpozabilInainteDeDeduceri === 0 ? '' : venitImpozabilInainteDeDeduceri}
                            </td>
                          );
                        })()}
                        {/* Page 5: Deducere % (auto-calculated) */}
                        {(() => {
                          // Use saved rounded values from DB
                          const salBrutCfZileLucrate = employee.salBrutCfZileLucrateRounded ?? 0;
                          const indemCOMedical = employee.indemCOMedicalRounded ?? 0;
                          const indemCOOdihna = employee.indemCOOdihnaRounded ?? 0;
                          
                          const totalVenituriBrute = salBrutCfZileLucrate + indemCOMedical + indemCOOdihna;
                          
                          // Calculate zileLucrate for Tichete de masa calculation
                          const zileMed = employee.zileCOMedical ?? 0;
                          const zileOdihna = employee.zileCOOdihna ?? 0;
                          const zileLucrate = workingDaysCurrentMonth != null
                            ? Math.max(0, workingDaysCurrentMonth - zileMed - zileOdihna)
                            : 0;
                          
                          // Calculate Tichete de masa
                          let ticheteDeMasa = 0;
                          if (employee.ticheteDeMasa === 'DA') {
                            const valoareTichetDeMasa = employee.valoareTichetDeMasa ?? defaultTichetValue;
                            ticheteDeMasa = (zileLucrate > 0)
                              ? zileLucrate * valoareTichetDeMasa
                              : 0;
                          }
                          
                          // Calculate VENIT PT CALCUL DEDUCERE = Total Venituri Brute + Tichete de masa
                          const venitPtCalculDeducere = totalVenituriBrute + ticheteDeMasa;
                          
                          // Get number of dependents from employee
                          const numDependents = employee.persoaneIntretinere ?? 0;
                          
                          // Look up the deduction percentage from the lookup table
                          const deducerePercentage = lookupDeducerePercentage(venitPtCalculDeducere, numDependents);
                          
                          return (
                            <td style={{
                                padding: '16px 24px',
                                color: '#333',
                                fontSize: '15px',
                                borderRight: '1px solid #e0e0e0'
                            }}>
                              {deducerePercentage !== null ? `${deducerePercentage.toFixed(1)}%` : ''}
                            </td>
                          );
                        })()}
                        {/* Page 5: Deducere personala (auto-calculated) */}
                        {(() => {
                          // IF "Functia de baza" = NU Then Deducere personala = 0
                          if (employee.principalLocMunca === 'NU') {
                            return (
                              <td style={{
                                padding: '16px 24px',
                                color: '#333',
                                fontSize: '15px',
                                borderRight: '1px solid #e0e0e0'
                              }}>
                                0
                              </td>
                            );
                          }
                          
                          // ELSE IF "Functia de baza" = DA Then "Deducere personala" = "Deducere %" TIMES "Salariul minim pe economie"
                          // Calculate Total Venituri Brute (same as page 3)
                          const salariuCIM = employee.salariuCIM ?? defaultSalariuCIM;
                          const zileMed = employee.zileCOMedical ?? 0;
                          const zileOdihna = employee.zileCOOdihna ?? 0;
                          const zileLucrate = workingDaysCurrentMonth != null
                            ? Math.max(0, workingDaysCurrentMonth - zileMed - zileOdihna)
                            : 0;
                          const salBrutCfZileLucrate = (workingDaysCurrentMonth != null && workingDaysCurrentMonth > 0)
                            ? salariuCIM * (zileLucrate / workingDaysCurrentMonth)
                            : 0;
                          
                          const zileCOMed = employee.zileCOMedical ?? 0;
                          const indemnizatieZiCOMed = employee.indemnizatieZiCOMedical ?? 0;
                          const indemCOMedical = zileCOMed * indemnizatieZiCOMed;
                          
                          const zileCOOdihna = employee.zileCOOdihna ?? 0;
                          const indemnizatieZiCOOdihna = employee.indemnizatieZiCOOdihna ?? 0;
                          const indemCOOdihna = zileCOOdihna * indemnizatieZiCOOdihna;
                          
                          const totalVenituriBrute = salBrutCfZileLucrate + indemCOMedical + indemCOOdihna;
                          
                          // Calculate Tichete de masa
                          let ticheteDeMasa = 0;
                          if (employee.ticheteDeMasa === 'DA') {
                            const valoareTichetDeMasa = employee.valoareTichetDeMasa ?? defaultTichetValue;
                            ticheteDeMasa = (zileLucrate > 0)
                              ? zileLucrate * valoareTichetDeMasa
                              : 0;
                          }
                          
                          // Calculate VENIT PT CALCUL DEDUCERE = Total Venituri Brute + Tichete de masa
                          const venitPtCalculDeducere = totalVenituriBrute + ticheteDeMasa;
                          
                          // Get number of dependents from employee
                          const numDependents = employee.persoaneIntretinere ?? 0;
                          
                          // Look up the deduction percentage from the lookup table (Deducere %)
                          const deducerePercentage = lookupDeducerePercentage(venitPtCalculDeducere, numDependents);
                          
                          // Calculate Deducere personala = Deducere % * Salariul minim pe economie
                          // Note: Deducere % is already a percentage (e.g., 20.0), so we divide by 100
                          const deducerePersonala = deducerePercentage !== null
                            ? Math.round((deducerePercentage / 100) * salariulMinimPeEconomie)
                            : 0;
                          
                          return (
                            <td style={{
                                padding: '16px 24px',
                                color: '#333',
                                fontSize: '15px',
                                borderRight: '1px solid #e0e0e0'
                            }}>
                              {deducerePersonala === 0 ? '' : deducerePersonala}
                            </td>
                          );
                        })()}
                        {/* Page 5: Deducere minori (auto-calculated) */}
                        {(() => {
                          // IF "Functia de baza" = NU Then "Deducere minori" = 0
                          if (employee.principalLocMunca === 'NU') {
                            return (
                              <td style={{
                                padding: '16px 24px',
                                color: '#333',
                                fontSize: '15px'
                              }}>
                                0
                              </td>
                            );
                          }
                          
                          // ELSE IF "Functia de baza" = DA Then "Deducere minori" = ROUNDED("Minori in intretinere" × "Deducere / minor in intretinere" from Setari legale tab)
                          const minoriInIntretinere = employee.dinCareMinori ?? 0;
                          const deducereMinori = Math.round(minoriInIntretinere * deducereMinorInIntretinere);
                          
                          return (
                            <td style={{
                              padding: '16px 24px',
                              color: '#333',
                              fontSize: '15px'
                            }}>
                              {deducereMinori === 0 ? '' : deducereMinori}
                            </td>
                          );
                        })()}
                      </>
                    ) : columnPage === 6 ? (
                      <>
                        {/* Page 6: Deducere pentru tineri <26 ani (auto-calculated) */}
                        {(() => {
                          // IF "Functia de baza" = NU Then "Deducere pentru tineri <26 ani" = 0
                          if (employee.principalLocMunca === 'NU') {
                            return (
                              <td style={{
                                padding: '16px 24px',
                                color: '#333',
                                fontSize: '15px',
                                borderRight: '1px solid #e0e0e0'
                              }}>
                                0
                              </td>
                            );
                          }
                          
                          // ELSE IF "Varsta" < 26 THEN Deducere pentru tineri <26 = ROUNDED("Deducere pentru tineri <26 ani" from "Setari legale" tab)
                          // ELSE "Deducere pentru tineri <26 ani" = 0
                          const varsta = employee.varsta ?? 0;
                          const deducerePentruTineriVal = varsta < 26 ? Math.round(deducerePentruTineri) : 0;
                          
                          return (
                            <td style={{
                              padding: '16px 24px',
                              color: '#333',
                              fontSize: '15px',
                              borderRight: '1px solid #e0e0e0'
                            }}>
                              {deducerePentruTineriVal === 0 ? '' : deducerePentruTineriVal}
                            </td>
                          );
                        })()}
                        {/* Page 6: Venit impozabil dupa deduceri (auto-calculated) */}
                        {(() => {
                          // Use saved rounded values from DB
                          const salBrutCfZileLucrate = employee.salBrutCfZileLucrateRounded ?? 0;
                          const indemCOMedical = employee.indemCOMedicalRounded ?? 0;
                          const indemCOOdihna = employee.indemCOOdihnaRounded ?? 0;
                          
                          const totalVenituriBrute = salBrutCfZileLucrate + indemCOMedical + indemCOOdihna;
                          
                          // Calculate Scutire de taxe
                          const scutireDeTaxe = employee.principalLocMunca === 'NU' 
                            ? 0 
                            : (totalVenituriBrute <= 4300 ? sumaScutitaDeTaxe : 0);
                          
                          // Calculate Bază de calcul contribuții (rounded)
                          const bazaDeCalculContributii = Math.round(totalVenituriBrute - scutireDeTaxe);
                          
                          // Calculate CAS (rounded)
                          const cas = Math.round(bazaDeCalculContributii * casValue);
                          
                          // Calculate CASS (rounded)
                          const cass = Math.round(bazaDeCalculContributii * cassValue);
                          
                          // Calculate zileLucrate for Tichete de masa calculation
                          const zileMed = employee.zileCOMedical ?? 0;
                          const zileOdihna = employee.zileCOOdihna ?? 0;
                          const zileLucrate = workingDaysCurrentMonth != null
                            ? Math.max(0, workingDaysCurrentMonth - zileMed - zileOdihna)
                            : 0;
                          
                          // Calculate Tichete de masa (rounded)
                          let ticheteDeMasa = 0;
                          if (employee.ticheteDeMasa === 'DA') {
                            const valoareTichetDeMasa = employee.valoareTichetDeMasa ?? defaultTichetValue;
                            ticheteDeMasa = (zileLucrate > 0)
                              ? Math.round(zileLucrate * valoareTichetDeMasa)
                              : 0;
                          }
                          
                          // Calculate CASS Tichete de masa (rounded)
                          const cassTicheteDeMasa = Math.round(ticheteDeMasa * cassValue);
                          
                          // Calculate Venit impozabil înainte de deduceri (using rounded values)
                          const venitImpozabilInainteDeDeduceri = bazaDeCalculContributii - cas - cass - cassTicheteDeMasa + ticheteDeMasa;
                          
                          // Calculate Deducere personala
                          let deducerePersonala = 0;
                          if (employee.principalLocMunca === 'DA') {
                            const venitPtCalculDeducere = totalVenituriBrute + ticheteDeMasa;
                            const numDependents = employee.persoaneIntretinere ?? 0;
                            const deducerePercentage = lookupDeducerePercentage(venitPtCalculDeducere, numDependents);
                            deducerePersonala = deducerePercentage !== null
                              ? Math.round((deducerePercentage / 100) * salariulMinimPeEconomie)
                              : 0;
                          }
                          
                          // Calculate Deducere minori
                          let deducereMinori = 0;
                          if (employee.principalLocMunca === 'DA') {
                            const minoriInIntretinere = employee.dinCareMinori ?? 0;
                            deducereMinori = Math.round(minoriInIntretinere * deducereMinorInIntretinere);
                          }
                          
                          // Calculate Deducere pentru tineri <26 ani
                          let deducerePentruTineriVal = 0;
                          if (employee.principalLocMunca === 'DA') {
                            const varsta = employee.varsta ?? 0;
                            deducerePentruTineriVal = varsta < 26 ? Math.round(deducerePentruTineri) : 0;
                          }
                          
                          // Calculate Venit impozabil dupa deduceri = Rounded(Venit impozabil înainte de deduceri) - Rounded(Deducere personala) - Rounded(Deducere minori) - Rounded(Deducere pentru tineri <26 ani)
                          const venitImpozabilDupaDeduceri = venitImpozabilInainteDeDeduceri - deducerePersonala - deducereMinori - deducerePentruTineriVal;
                          
                          return (
                            <td style={{
                              padding: '16px 24px',
                              color: '#333',
                              fontSize: '15px',
                              borderRight: '1px solid #e0e0e0'
                            }}>
                              {venitImpozabilDupaDeduceri === 0 ? '' : venitImpozabilDupaDeduceri}
                            </td>
                          );
                        })()}
                        {/* Page 6: Impozit pe venit (auto-calculated) */}
                        {(() => {
                          // Use saved rounded values from DB
                          const salBrutCfZileLucrate = employee.salBrutCfZileLucrateRounded ?? 0;
                          const indemCOMedical = employee.indemCOMedicalRounded ?? 0;
                          const indemCOOdihna = employee.indemCOOdihnaRounded ?? 0;
                          
                          const totalVenituriBrute = salBrutCfZileLucrate + indemCOMedical + indemCOOdihna;
                          
                          // Calculate Scutire de taxe
                          const scutireDeTaxe = employee.principalLocMunca === 'NU' 
                            ? 0 
                            : (totalVenituriBrute <= 4300 ? sumaScutitaDeTaxe : 0);
                          
                          // Calculate Bază de calcul contribuții
                          const bazaDeCalculContributii = totalVenituriBrute - scutireDeTaxe;
                          
                          // Calculate CAS
                          const cas = bazaDeCalculContributii * casValue;
                          
                          // Calculate CASS
                          const cass = bazaDeCalculContributii * cassValue;
                          
                          // Calculate zileLucrate for Tichete de masa calculation
                          const zileMed = employee.zileCOMedical ?? 0;
                          const zileOdihna = employee.zileCOOdihna ?? 0;
                          const zileLucrate = workingDaysCurrentMonth != null
                            ? Math.max(0, workingDaysCurrentMonth - zileMed - zileOdihna)
                            : 0;
                          
                          // Calculate Tichete de masa
                          let ticheteDeMasa = 0;
                          if (employee.ticheteDeMasa === 'DA') {
                            const valoareTichetDeMasa = employee.valoareTichetDeMasa ?? defaultTichetValue;
                            ticheteDeMasa = (zileLucrate > 0)
                              ? zileLucrate * valoareTichetDeMasa
                              : 0;
                          }
                          
                          // Calculate CASS Tichete de masa = ROUNDED(Tichete de masa * CASS value)
                          const cassTicheteDeMasa = Math.round(ticheteDeMasa * cassValue);
                          
                          // Calculate Venit impozabil înainte de deduceri
                          const venitImpozabilInainteDeDeduceri = bazaDeCalculContributii - cas - cass - cassTicheteDeMasa + ticheteDeMasa;
                          
                          // Calculate Deducere personala
                          let deducerePersonala = 0;
                          if (employee.principalLocMunca === 'DA') {
                            const venitPtCalculDeducere = totalVenituriBrute + ticheteDeMasa;
                            const numDependents = employee.persoaneIntretinere ?? 0;
                            const deducerePercentage = lookupDeducerePercentage(venitPtCalculDeducere, numDependents);
                            deducerePersonala = deducerePercentage !== null
                              ? Math.round((deducerePercentage / 100) * salariulMinimPeEconomie)
                              : 0;
                          }
                          
                          // Calculate Deducere minori
                          let deducereMinori = 0;
                          if (employee.principalLocMunca === 'DA') {
                            const minoriInIntretinere = employee.dinCareMinori ?? 0;
                            deducereMinori = Math.round(minoriInIntretinere * deducereMinorInIntretinere);
                          }
                          
                          // Calculate Deducere pentru tineri <26 ani
                          let deducerePentruTineriVal = 0;
                          if (employee.principalLocMunca === 'DA') {
                            const varsta = employee.varsta ?? 0;
                            deducerePentruTineriVal = varsta < 26 ? Math.round(deducerePentruTineri) : 0;
                          }
                          
                          // Calculate Venit impozabil dupa deduceri = Rounded(Venit impozabil înainte de deduceri) - Rounded(Deducere personala) - Rounded(Deducere minori) - Rounded(Deducere pentru tineri <26 ani)
                          const venitImpozabilDupaDeduceri = venitImpozabilInainteDeDeduceri - deducerePersonala - deducereMinori - deducerePentruTineriVal;
                          
                          // Calculate Impozit pe venit = ROUNDED(Venit impozabil dupa deduceri * Cota impozit)
                          const impozitPeVenit = Math.round(venitImpozabilDupaDeduceri * cotaImpozit);
                          
                          return (
                            <td style={{
                                padding: '16px 24px',
                                color: '#333',
                                fontSize: '15px',
                                borderRight: '1px solid #e0e0e0'
                            }}>
                              {impozitPeVenit === 0 ? '' : impozitPeVenit}
                            </td>
                          );
                        })()}
                        {/* Page 6: Salariu net (auto-calculated) */}
                        {(() => {
                          // Use saved rounded values from DB
                          const salBrutCfZileLucrate = employee.salBrutCfZileLucrateRounded ?? 0;
                          const indemCOMedical = employee.indemCOMedicalRounded ?? 0;
                          const indemCOOdihna = employee.indemCOOdihnaRounded ?? 0;
                          
                          const totalVenituriBrute = salBrutCfZileLucrate + indemCOMedical + indemCOOdihna;
                          
                          // Calculate Scutire de taxe
                          const scutireDeTaxe = employee.principalLocMunca === 'NU' 
                            ? 0 
                            : (totalVenituriBrute <= 4300 ? sumaScutitaDeTaxe : 0);
                          
                          // Calculate Bază de calcul contribuții (rounded)
                          const bazaDeCalculContributii = Math.round(totalVenituriBrute - scutireDeTaxe);
                          
                          // Calculate CAS (rounded)
                          const cas = Math.round(bazaDeCalculContributii * casValue);
                          
                          // Calculate CASS (rounded)
                          const cass = Math.round(bazaDeCalculContributii * cassValue);
                          
                          // Calculate zileLucrate for Tichete de masa calculation
                          const zileMed = employee.zileCOMedical ?? 0;
                          const zileOdihna = employee.zileCOOdihna ?? 0;
                          const zileLucrate = workingDaysCurrentMonth != null
                            ? Math.max(0, workingDaysCurrentMonth - zileMed - zileOdihna)
                            : 0;
                          
                          // Calculate Tichete de masa (rounded)
                          let ticheteDeMasa = 0;
                          if (employee.ticheteDeMasa === 'DA') {
                            const valoareTichetDeMasa = employee.valoareTichetDeMasa ?? defaultTichetValue;
                            ticheteDeMasa = (zileLucrate > 0)
                              ? Math.round(zileLucrate * valoareTichetDeMasa)
                              : 0;
                          }
                          
                          // Calculate CASS Tichete de masa (rounded)
                          const cassTicheteDeMasa = Math.round(ticheteDeMasa * cassValue);
                          
                          // Calculate Venit impozabil înainte de deduceri (using rounded values)
                          const venitImpozabilInainteDeDeduceri = bazaDeCalculContributii - cas - cass - cassTicheteDeMasa + ticheteDeMasa;
                          
                          // Calculate Deducere personala
                          let deducerePersonala = 0;
                          if (employee.principalLocMunca === 'DA') {
                            const venitPtCalculDeducere = totalVenituriBrute + ticheteDeMasa;
                            const numDependents = employee.persoaneIntretinere ?? 0;
                            const deducerePercentage = lookupDeducerePercentage(venitPtCalculDeducere, numDependents);
                            deducerePersonala = deducerePercentage !== null
                              ? Math.round((deducerePercentage / 100) * salariulMinimPeEconomie)
                              : 0;
                          }
                          
                          // Calculate Deducere minori
                          let deducereMinori = 0;
                          if (employee.principalLocMunca === 'DA') {
                            const minoriInIntretinere = employee.dinCareMinori ?? 0;
                            deducereMinori = Math.round(minoriInIntretinere * deducereMinorInIntretinere);
                          }
                          
                          // Calculate Deducere pentru tineri <26 ani
                          let deducerePentruTineriVal = 0;
                          if (employee.principalLocMunca === 'DA') {
                            const varsta = employee.varsta ?? 0;
                            deducerePentruTineriVal = varsta < 26 ? Math.round(deducerePentruTineri) : 0;
                          }
                          
                          // Calculate Venit impozabil dupa deduceri = Rounded(Venit impozabil înainte de deduceri) - Rounded(Deducere personala) - Rounded(Deducere minori) - Rounded(Deducere pentru tineri <26 ani)
                          const venitImpozabilDupaDeduceri = venitImpozabilInainteDeDeduceri - deducerePersonala - deducereMinori - deducerePentruTineriVal;
                          
                          // Calculate Impozit pe venit (rounded)
                          const impozitPeVenit = Math.round(venitImpozabilDupaDeduceri * cotaImpozit);
                          
                          // Calculate Salariu net = Rounded(Total Venituri Brute) - Rounded(CAS) - Rounded(CASS) - Rounded(Impozit pe venit) - Rounded(CASS Tichete de masa)
                          const salariuNet = totalVenituriBrute - cas - cass - impozitPeVenit - cassTicheteDeMasa;
                          
                          return (
                            <td style={{
                                padding: '16px 24px',
                                color: '#333',
                                fontSize: '15px',
                                borderRight: '1px solid #e0e0e0'
                            }}>
                              {salariuNet === 0 ? '' : salariuNet}
                            </td>
                          );
                        })()}
                        {/* Page 6: CAM (auto-calculated) */}
                        {(() => {
                          // Use saved rounded values from DB
                          const salBrutCfZileLucrate = employee.salBrutCfZileLucrateRounded ?? 0;
                          const indemCOMedical = employee.indemCOMedicalRounded ?? 0;
                          const indemCOOdihna = employee.indemCOOdihnaRounded ?? 0;
                          
                          const totalVenituriBrute = salBrutCfZileLucrate + indemCOMedical + indemCOOdihna;
                          
                          // Calculate Scutire de taxe
                          const scutireDeTaxe = employee.principalLocMunca === 'NU' 
                            ? 0 
                            : (totalVenituriBrute <= 4300 ? sumaScutitaDeTaxe : 0);
                          
                          // Calculate Bază de calcul contribuții (rounded)
                          const bazaDeCalculContributii = Math.round(totalVenituriBrute - scutireDeTaxe);
                          
                          // Calculate CAM = ROUNDED(Bază de calcul contribuții * CAM value)
                          const cam = Math.round(bazaDeCalculContributii * camValue);
                          
                          return (
                        <td style={{
                              padding: '16px 24px',
                              color: '#333',
                              fontSize: '15px'
                            }}>
                              {cam === 0 ? '' : cam}
                            </td>
                          );
                        })()}
                      </>
                    ) : null}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}



