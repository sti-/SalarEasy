'use client';

import { useState, useEffect, useRef } from 'react';
import { getLegalSettings, saveLegalSettings, type LegalSettings } from '../../lib/db';

interface AttributeHistory {
  value: number;
  startDate: string;
  endDate: string | null;
}

interface AttributeData {
  currentValue: number;
  history: AttributeHistory[];
}

interface LegalSettings {
  [key: string]: AttributeData;
}

const DEFAULT_VALUES = {
  'Salariul minim pe economie': 4050,
  'Valoare tichet de masa - default clienti BONO': 40,
  'Deducere / minor in intretinere': 100,
  'Deducere pentru tineri <26 ani': 607.5,
  'Salariul CIM clienti Bono': 4050,
  'Suma scutita de taxe': 300,
  'CASS': 0.1,
  'CAS': 0.25,
  'Cota impozit': 0.1,
  'CAM': 0.0225,
  'Numar zile CO odihna / an - default clienti BONO': 0,
  'Primele x zile de CO medical neplatite, cf. legii': 0,
  'Indemnizatie CO medical': 0,
  'Indemnizatie CO odihna': 0,
};

const PERCENTAGE_FIELDS = ['CASS', 'CAS', 'Cota impozit', 'CAM'];

const SECTIONS = {
  'Salariu': [
    'Salariul minim pe economie',
    'Salariul CIM clienti Bono',
    'Valoare tichet de masa - default clienti BONO'
  ],
  'Deduceri': [
    'Suma scutita de taxe',
    'Deducere / minor in intretinere',
    'Deducere pentru tineri <26 ani'
  ],
  'Taxe': [
    'CASS',
    'CAS',
    'Cota impozit',
    'CAM'
  ],
  'Concedii': [
    'Numar zile CO odihna / an - default clienti BONO',
    'Primele x zile de CO medical neplatite, cf. legii',
    'Indemnizatie CO medical',
    'Indemnizatie CO odihna'
  ]
};

export default function Settings() {
  const [settings, setSettings] = useState<LegalSettings>({});
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [expandedHistory, setExpandedHistory] = useState<string | null>(null);
  const historyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadSettings() {
      const now = new Date().toISOString().split('T')[0];
      const stored = await getLegalSettings();
      
      if (Object.keys(stored).length > 0) {
        const parsedSettings = { ...stored };
        
        // Migrate old key to new key if it exists
        if (parsedSettings['Valoare tichet de masa'] && !parsedSettings['Valoare tichet de masa - default clienti BONO']) {
          parsedSettings['Valoare tichet de masa - default clienti BONO'] = parsedSettings['Valoare tichet de masa'];
          delete parsedSettings['Valoare tichet de masa'];
        }
        
        // Migrate percentage fields from percentage values to decimal values
        PERCENTAGE_FIELDS.forEach(key => {
          if (parsedSettings[key]) {
            const currentValue = parsedSettings[key].currentValue;
            // If value is > 1, it's stored as percentage (e.g., 10 for 10%), convert to decimal
            if (currentValue > 1) {
              parsedSettings[key].currentValue = currentValue / 100;
              // Also update history entries
              parsedSettings[key].history = parsedSettings[key].history.map((entry: AttributeHistory) => ({
                ...entry,
                value: entry.value > 1 ? entry.value / 100 : entry.value
              }));
            }
          }
        });
        
        // Ensure all default values exist in settings (initialize missing ones)
        Object.entries(DEFAULT_VALUES).forEach(([key, value]) => {
          if (!parsedSettings[key]) {
            parsedSettings[key] = {
              currentValue: value,
              history: [{
                value,
                startDate: now,
                endDate: null,
              }],
            };
          }
        });
        
        await saveLegalSettings(parsedSettings);
        setSettings(parsedSettings);
      } else {
        // Initialize with default values
        const initial: LegalSettings = {};
        Object.entries(DEFAULT_VALUES).forEach(([key, value]) => {
          initial[key] = {
            currentValue: value,
            history: [{
              value,
              startDate: now,
              endDate: null,
            }],
          };
        });
        const saveSuccess = await saveLegalSettings(initial);
        if (saveSuccess) {
          console.log('Successfully initialized legal settings with default values.');
          setSettings(initial);
        } else {
          console.error('Failed to save initial legal settings. Please check the console for errors.');
          // Still set the settings in the UI even if save failed
          setSettings(initial);
        }
      }
    }
    loadSettings();
  }, []);

  useEffect(() => {
    // Auto-scroll to history table when it's expanded
    if (expandedHistory && historyRef.current) {
      setTimeout(() => {
        historyRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }, 100);
    }
  }, [expandedHistory]);

  const handleEdit = (key: string) => {
    setEditingKey(key);
    const currentValue = settings[key]?.currentValue ?? DEFAULT_VALUES[key] ?? 0;
    // Convert to percentage for display if it's a percentage field
    const displayValue = PERCENTAGE_FIELDS.includes(key) ? (currentValue * 100) : currentValue;
    setEditValue(displayValue.toString());
  };

  const handleSave = async (key: string) => {
    let newValue = parseFloat(editValue);
    if (isNaN(newValue) || newValue < 0) {
      alert('Please enter a valid positive number');
      return;
    }
    // Convert from percentage to decimal if it's a percentage field
    if (PERCENTAGE_FIELDS.includes(key)) {
      newValue = newValue / 100;
    }

    const now = new Date().toISOString().split('T')[0];
    const updatedSettings = { ...settings };
    
    // Initialize the key if it doesn't exist
    if (!updatedSettings[key]) {
      const defaultValue = DEFAULT_VALUES[key] || 0;
      updatedSettings[key] = {
        currentValue: defaultValue,
        history: [{
          value: defaultValue,
          startDate: now,
          endDate: null,
        }],
      };
    }
    
    // Update the previous history entry's endDate
    if (updatedSettings[key].history.length > 0) {
      const lastEntry = updatedSettings[key].history[updatedSettings[key].history.length - 1];
      if (lastEntry.endDate === null) {
        lastEntry.endDate = now;
      }
    }

    // Add new history entry
    updatedSettings[key] = {
      currentValue: newValue,
      history: [
        ...updatedSettings[key].history,
        {
          value: newValue,
          startDate: now,
          endDate: null,
        },
      ],
    };

    setSettings(updatedSettings);
    const success = await saveLegalSettings(updatedSettings);
    if (!success) {
      alert('Error saving settings. Please try again.');
      return;
    }
    setEditingKey(null);
    setEditValue('');
  };

  const handleCancel = () => {
    setEditingKey(null);
    setEditValue('');
  };

  const toggleHistory = (key: string) => {
    setExpandedHistory(expandedHistory === key ? null : key);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ro-RO', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit' 
    });
  };

  return (
    <main style={{
      padding: '40px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      maxWidth: '1200px',
      margin: '0 auto'
    }}>
      {Object.entries(SECTIONS).map(([sectionName, sectionKeys], sectionIndex) => (
        <div 
          key={sectionName}
          style={{
            marginBottom: sectionIndex < Object.keys(SECTIONS).length - 1 ? '32px' : '0'
          }}
        >
          <h2 style={{
            fontSize: '20px',
            fontWeight: '600',
            marginBottom: '16px',
            color: '#1a1a1a'
          }}>
            {sectionName}
          </h2>
          
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            overflow: 'hidden'
          }}>
            {sectionKeys.length > 0 ? (
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
                      width: '60%'
                    }}>
                      Attributes
                    </th>
                    <th style={{
                      padding: '16px 24px',
                      textAlign: 'left',
                      fontWeight: '600',
                      color: '#333',
                      fontSize: '14px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      width: '40%'
                    }}>
                      Default Value
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sectionKeys.map((key, index) => {
              const isEditing = editingKey === key;
              const currentValue = settings[key]?.currentValue ?? DEFAULT_VALUES[key];
              
              return (
                <tr 
                  key={key}
                  style={{
                    borderBottom: '1px solid #f0f0f0',
                    backgroundColor: index % 2 === 0 ? '#ffffff' : '#fafafa'
                  }}
                >
                  <td style={{
                    padding: '16px 24px',
                    color: '#333',
                    fontSize: '15px',
                    verticalAlign: 'middle'
                  }}>
                    {key}
                  </td>
                  <td style={{
                    padding: '16px 24px',
                    color: '#333',
                    fontSize: '15px',
                    verticalAlign: 'middle'
                  }}>
                    {isEditing ? (
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <input
                            type="number"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            style={{
                              padding: '8px 12px',
                              border: '1px solid #ddd',
                              borderRadius: '4px',
                              fontSize: '15px',
                              width: '120px'
                            }}
                            step="0.01"
                            min="0"
                            autoFocus
                          />
                          {PERCENTAGE_FIELDS.includes(key) && (
                            <span style={{ fontSize: '15px', color: '#333' }}>%</span>
                          )}
                        </div>
                        <button
                          onClick={() => handleSave(key)}
                          style={{
                            padding: '6px 16px',
                            backgroundColor: '#D66185',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '500'
                          }}
                        >
                          Save
                        </button>
                        <button
                          onClick={handleCancel}
                          style={{
                            padding: '6px 16px',
                            backgroundColor: '#f5f5f5',
                            color: '#333',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '14px',
                            fontWeight: '500'
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div style={{ 
                        display: 'flex', 
                        gap: '24px', 
                        alignItems: 'center'
                      }}>
                        <span style={{ 
                          fontWeight: '500',
                          minWidth: '80px',
                          lineHeight: '1.5'
                        }}>
                          {PERCENTAGE_FIELDS.includes(key) 
                            ? `${parseFloat((currentValue * 100).toFixed(2))}%` 
                            : currentValue}
                        </span>
                        <div style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '8px',
                          alignItems: 'flex-start'
                        }}>
                          <button
                            onClick={() => handleEdit(key)}
                            style={{
                              padding: '4px 12px',
                              backgroundColor: 'transparent',
                              color: '#D66185',
                              border: '1px solid #D66185',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '13px',
                              fontWeight: '500',
                              width: '120px',
                              textAlign: 'center'
                            }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => toggleHistory(key)}
                            style={{
                              padding: '4px 12px',
                              backgroundColor: 'transparent',
                              color: '#808080',
                              border: '1px solid #ddd',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '13px',
                              fontWeight: '500',
                              width: '120px',
                              textAlign: 'center'
                            }}
                          >
                            {expandedHistory === key ? 'Hide History' : 'Show History'}
                          </button>
                        </div>
                      </div>
                    )}
                  </td>
                </tr>
              );
                  })}
                </tbody>
              </table>
            ) : (
              <div style={{
                padding: '40px',
                textAlign: 'center',
                color: '#808080',
                fontSize: '16px'
              }}>
                No attributes in this section
              </div>
            )}
          </div>
        </div>
      ))}

      {/* History Display */}
      {expandedHistory && settings[expandedHistory] && (
        <div 
          ref={historyRef}
          style={{
            marginTop: '24px',
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            padding: '24px'
          }}
        >
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px'
          }}>
            <h2 style={{
              fontSize: '18px',
              fontWeight: '600',
              margin: 0,
              color: '#1a1a1a'
            }}>
              History: {expandedHistory}
            </h2>
            <button
              onClick={() => setExpandedHistory(null)}
              style={{
                padding: '4px 12px',
                backgroundColor: 'transparent',
                color: '#808080',
                border: '1px solid #ddd',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '18px',
                fontWeight: '600',
                lineHeight: '1',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Close history"
            >
              ×
            </button>
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
                  padding: '12px 16px',
                  textAlign: 'left',
                  fontWeight: '600',
                  color: '#333',
                  fontSize: '13px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Value
                </th>
                <th style={{
                  padding: '12px 16px',
                  textAlign: 'left',
                  fontWeight: '600',
                  color: '#333',
                  fontSize: '13px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Valid From
                </th>
                <th style={{
                  padding: '12px 16px',
                  textAlign: 'left',
                  fontWeight: '600',
                  color: '#333',
                  fontSize: '13px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Valid Until
                </th>
              </tr>
            </thead>
            <tbody>
              {settings[expandedHistory].history.slice().reverse().map((entry, index) => (
                <tr 
                  key={index}
                  style={{
                    borderBottom: '1px solid #f0f0f0',
                    backgroundColor: index % 2 === 0 ? '#ffffff' : '#fafafa'
                  }}
                >
                  <td style={{
                    padding: '12px 16px',
                    color: '#333',
                    fontSize: '14px',
                    fontWeight: entry.endDate === null ? '600' : '400'
                  }}>
                    {PERCENTAGE_FIELDS.includes(expandedHistory) 
                      ? `${parseFloat((entry.value * 100).toFixed(2))}%` 
                      : entry.value}
                    {entry.endDate === null && (
                      <span style={{ 
                        marginLeft: '8px', 
                        color: '#D66185', 
                        fontSize: '12px',
                        fontWeight: '500'
                      }}>
                        (Current)
                      </span>
                    )}
                  </td>
                  <td style={{
                    padding: '12px 16px',
                    color: '#333',
                    fontSize: '14px'
                  }}>
                    {formatDate(entry.startDate)}
                  </td>
                  <td style={{
                    padding: '12px 16px',
                    color: '#333',
                    fontSize: '14px'
                  }}>
                    {entry.endDate ? formatDate(entry.endDate) : 'Present'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}

