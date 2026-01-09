'use client';

import { useState, useEffect } from 'react';
import { getWorkingDays, saveWorkingDays, type WorkingDaysData } from '../../lib/db';

interface WorkingDaysData {
  [year: string]: {
    [month: number]: number;
  };
}

const MONTHS = [
  { month: 1, name: 'Ianuarie' },
  { month: 2, name: 'Februarie' },
  { month: 3, name: 'Martie' },
  { month: 4, name: 'Aprilie' },
  { month: 5, name: 'Mai' },
  { month: 6, name: 'Iunie' },
  { month: 7, name: 'Iulie' },
  { month: 8, name: 'August' },
  { month: 9, name: 'Septembrie' },
  { month: 10, name: 'Octombrie' },
  { month: 11, name: 'Noiembrie' },
  { month: 12, name: 'Decembrie' },
];

const DEFAULT_DATA: WorkingDaysData = {
  '2025': {
    1: 18, 2: 20, 3: 21, 4: 20, 5: 21, 6: 20,
    7: 23, 8: 20, 9: 22, 10: 23, 11: 20, 12: 20
  },
  '2026': {
    1: 18, 2: 20, 3: 22, 4: 20, 5: 20, 6: 21,
    7: 23, 8: 21, 9: 22, 10: 22, 11: 20, 12: 21
  }
};

export default function ZileLucratoare() {
  const [data, setData] = useState<WorkingDaysData>({});
  const [showAddYearForm, setShowAddYearForm] = useState(false);
  const [newYear, setNewYear] = useState<string>('');
  const [newYearValues, setNewYearValues] = useState<{ [month: number]: string }>({});
  const [editingYear, setEditingYear] = useState<string | null>(null);
  const [editYearValues, setEditYearValues] = useState<{ [month: number]: string }>({});
  const [editingCell, setEditingCell] = useState<{ year: string; month: number } | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  useEffect(() => {
    async function loadData() {
      const stored = await getWorkingDays();
      if (Object.keys(stored).length > 0) {
        setData(stored);
      } else {
        setData(DEFAULT_DATA);
        await saveWorkingDays(DEFAULT_DATA);
      }
    }
    loadData();
  }, []);

  const years = Object.keys(data).sort();

  const handleAddYearClick = () => {
    setShowAddYearForm(true);
    setNewYear('');
    const initialValues: { [month: number]: string } = {};
    MONTHS.forEach(m => {
      initialValues[m.month] = '';
    });
    setNewYearValues(initialValues);
  };

  const handleSaveNewYear = async () => {
    if (!newYear || !/^\d{4}$/.test(newYear)) {
      alert('Please enter a valid 4-digit year');
      return;
    }

    if (data[newYear]) {
      alert('This year already exists');
      return;
    }

    const yearData: { [month: number]: number } = {};
    let allValid = true;

    MONTHS.forEach(m => {
      const value = parseInt(newYearValues[m.month]);
      if (isNaN(value) || value < 0 || value > 31) {
        allValid = false;
      } else {
        yearData[m.month] = value;
      }
    });

    if (!allValid) {
      alert('Please enter valid working days (0-31) for all months');
      return;
    }

    const updatedData = {
      ...data,
      [newYear]: yearData
    };

    setData(updatedData);
    const success = await saveWorkingDays(updatedData);
    if (!success) {
      alert('Error saving working days. Please try again.');
      return;
    }
    setShowAddYearForm(false);
    setNewYear('');
    setNewYearValues({});
  };

  const handleCancelAddYear = () => {
    setShowAddYearForm(false);
    setNewYear('');
    setNewYearValues({});
  };

  const handleEditYearClick = (year: string) => {
    setEditingYear(year);
    const initialValues: { [month: number]: string } = {};
    MONTHS.forEach(m => {
      initialValues[m.month] = (data[year]?.[m.month] ?? 0).toString();
    });
    setEditYearValues(initialValues);
  };

  const handleSaveEditYear = async () => {
    if (!editingYear) return;

    const yearData: { [month: number]: number } = {};
    let allValid = true;

    MONTHS.forEach(m => {
      const value = parseInt(editYearValues[m.month]);
      if (isNaN(value) || value < 0 || value > 31) {
        allValid = false;
      } else {
        yearData[m.month] = value;
      }
    });

    if (!allValid) {
      alert('Please enter valid working days (0-31) for all months');
      return;
    }

    const updatedData = {
      ...data,
      [editingYear]: yearData
    };

    setData(updatedData);
    const success = await saveWorkingDays(updatedData);
    if (!success) {
      alert('Error saving working days. Please try again.');
      return;
    }
    setEditingYear(null);
    setEditYearValues({});
  };

  const handleCancelEditYear = () => {
    setEditingYear(null);
    setEditYearValues({});
  };

  const handleCellClick = (year: string, month: number) => {
    if (editingYear === year) return; // Don't allow cell editing when year is being edited
    setEditingCell({ year, month });
    setEditValue(data[year][month].toString());
  };

  const handleSaveCell = async () => {
    if (!editingCell) return;

    const value = parseInt(editValue);
    if (isNaN(value) || value < 0 || value > 31) {
      alert('Please enter a valid number between 0 and 31');
      return;
    }

    const updatedData = {
      ...data,
      [editingCell.year]: {
        ...data[editingCell.year],
        [editingCell.month]: value
      }
    };

    setData(updatedData);
    const success = await saveWorkingDays(updatedData);
    if (!success) {
      alert('Error saving working days. Please try again.');
      return;
    }
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
        alignItems: 'center',
        marginBottom: '32px'
      }}>
        <h1 style={{
          fontSize: '32px',
          fontWeight: '600',
          color: '#1a1a1a',
          margin: 0
        }}>
          Zile lucratoare
        </h1>
        <button
          onClick={handleAddYearClick}
          style={{
            padding: '12px 24px',
            backgroundColor: '#D66185',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '15px',
            fontWeight: '600',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
          }}
        >
          Adauga an
        </button>
      </div>

      {showAddYearForm && (
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          padding: '32px',
          marginBottom: '24px'
        }}>
          <h2 style={{
            fontSize: '20px',
            fontWeight: '600',
            marginBottom: '24px',
            color: '#1a1a1a'
          }}>
            Adauga an nou
          </h2>
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: '500',
              color: '#333',
              fontSize: '14px'
            }}>
              An:
            </label>
            <input
              type="text"
              value={newYear}
              onChange={(e) => setNewYear(e.target.value)}
              placeholder="ex: 2027"
              style={{
                padding: '10px 16px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '15px',
                width: '200px'
              }}
              maxLength={4}
            />
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '16px',
            marginBottom: '24px'
          }}>
            {MONTHS.map(m => (
              <div key={m.month}>
                <label style={{
                  display: 'block',
                  marginBottom: '6px',
                  fontWeight: '500',
                  color: '#333',
                  fontSize: '13px'
                }}>
                  {m.name}:
                </label>
                <input
                  type="number"
                  value={newYearValues[m.month] || ''}
                  onChange={(e) => setNewYearValues({
                    ...newYearValues,
                    [m.month]: e.target.value
                  })}
                  min="0"
                  max="31"
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px',
                    width: '100%'
                  }}
                />
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={handleSaveNewYear}
              style={{
                padding: '10px 24px',
                backgroundColor: '#D66185',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600'
              }}
            >
              Salveaza
            </button>
            <button
              onClick={handleCancelAddYear}
              style={{
                padding: '10px 24px',
                backgroundColor: '#f5f5f5',
                color: '#333',
                border: '1px solid #ddd',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              Anuleaza
            </button>
          </div>
        </div>
      )}

      {editingYear && (
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          padding: '32px',
          marginBottom: '24px'
        }}>
          <h2 style={{
            fontSize: '20px',
            fontWeight: '600',
            marginBottom: '24px',
            color: '#1a1a1a'
          }}>
            Editeaza an: {editingYear}
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '16px',
            marginBottom: '24px'
          }}>
            {MONTHS.map(m => (
              <div key={m.month}>
                <label style={{
                  display: 'block',
                  marginBottom: '6px',
                  fontWeight: '500',
                  color: '#333',
                  fontSize: '13px'
                }}>
                  {m.name}:
                </label>
                <input
                  type="number"
                  value={editYearValues[m.month] || ''}
                  onChange={(e) => setEditYearValues({
                    ...editYearValues,
                    [m.month]: e.target.value
                  })}
                  min="0"
                  max="31"
                  style={{
                    padding: '8px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px',
                    width: '100%'
                  }}
                />
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={handleSaveEditYear}
              style={{
                padding: '10px 24px',
                backgroundColor: '#D66185',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600'
              }}
            >
              Salveaza
            </button>
            <button
              onClick={handleCancelEditYear}
              style={{
                padding: '10px 24px',
                backgroundColor: '#f5f5f5',
                color: '#333',
                border: '1px solid #ddd',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              Anuleaza
            </button>
          </div>
        </div>
      )}

      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        padding: '40px',
        overflow: 'auto'
      }}>
        <h2 style={{
          fontSize: '20px',
          fontWeight: '600',
          marginBottom: '24px',
          color: '#1a1a1a'
        }}>
          Zile lucratoare in luna
        </h2>
        
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
                letterSpacing: '0.5px'
              }}>
                Luna / An
              </th>
              {years.map(year => (
                <th
                  key={year}
                  style={{
                    padding: '16px 24px',
                    textAlign: 'center',
                    fontWeight: '600',
                    color: '#333',
                    fontSize: '14px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    alignItems: 'center'
                  }}>
                    <span>{year}</span>
                    <button
                      onClick={() => handleEditYearClick(year)}
                      style={{
                        padding: '6px 16px',
                        backgroundColor: 'transparent',
                        color: '#D66185',
                        border: '1px solid #D66185',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: '500',
                        textTransform: 'none',
                        letterSpacing: '0'
                      }}
                    >
                      Edit
                    </button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MONTHS.map((month, index) => (
              <tr 
                key={month.month}
                style={{
                  borderBottom: '1px solid #f0f0f0',
                  backgroundColor: index % 2 === 0 ? '#ffffff' : '#fafafa'
                }}
              >
                <td style={{
                  padding: '16px 24px',
                  color: '#333',
                  fontSize: '15px'
                }}>
                  {month.name}
                </td>
                {years.map(year => {
                  const isEditing = editingCell?.year === year && editingCell?.month === month.month;
                  const isYearBeingEdited = editingYear === year;
                  const value = data[year]?.[month.month] ?? 0;

                  return (
                    <td
                      key={year}
                      style={{
                        padding: '16px 24px',
                        textAlign: 'center',
                        color: '#333',
                        fontSize: '15px',
                        fontWeight: '500',
                        cursor: isYearBeingEdited ? 'default' : 'pointer',
                        backgroundColor: isYearBeingEdited ? '#fff9e6' : 'transparent'
                      }}
                      onClick={() => !isYearBeingEdited && !isEditing && handleCellClick(year, month.month)}
                    >
                      {isEditing ? (
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center' }}>
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
                              width: '60px',
                              textAlign: 'center'
                            }}
                            min="0"
                            max="31"
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
                        value
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}

