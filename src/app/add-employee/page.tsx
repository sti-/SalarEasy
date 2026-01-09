'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getEmployees, addEmployee, getLegalSettings } from '../../lib/db';

export default function AddEmployee() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    nume: '',
    companie: '',
    principalLocMunca: 'DA',
    persoaneIntretinere: '',
    dinCareMinori: '',
    varsta: '',
    ticheteDeMasa: 'NU',
    valoareTichetDeMasa: ''
  });
  const [nextUniqueId, setNextUniqueId] = useState('IDS_1');

  useEffect(() => {
    async function loadNextId() {
      const existingEmployees = await getEmployees();
      const nextIdNumber = existingEmployees.length + 1;
      setNextUniqueId(`IDS_${nextIdNumber}`);
    }
    loadNextId();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // If Tichete de masa is changed to DA, populate with default value from settings
    if (name === 'ticheteDeMasa' && value === 'DA') {
      async function loadDefaultTichet() {
        const legalSettings = await getLegalSettings();
        // Try new key first, then old key (for migration compatibility), then default value 40
        const defaultTichetValue = legalSettings['Valoare tichet de masa - default clienti BONO']?.currentValue 
          || legalSettings['Valoare tichet de masa']?.currentValue 
          || 40;
        
        setFormData(prev => ({
          ...prev,
          [name]: value,
          valoareTichetDeMasa: defaultTichetValue.toString()
        }));
      }
      loadDefaultTichet();
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Get existing employees to calculate next ID
    const existingEmployees = await getEmployees();
    
    // Get the last employee ID or start from 1
    const lastId = existingEmployees.length > 0 
      ? Math.max(...existingEmployees.map((emp: any) => emp.id))
      : 0;
    
    // Create new employee with incremented ID
    const newEmployee = {
      id: lastId + 1,
      uniqueId: nextUniqueId,
      nume: formData.nume,
      companie: formData.companie,
      principalLocMunca: formData.principalLocMunca,
      persoaneIntretinere: formData.persoaneIntretinere === '' ? 0 : parseInt(formData.persoaneIntretinere),
      dinCareMinori: formData.dinCareMinori === '' ? 0 : parseInt(formData.dinCareMinori),
      varsta: parseInt(formData.varsta),
      ticheteDeMasa: formData.ticheteDeMasa,
      valoareTichetDeMasa: formData.ticheteDeMasa === 'DA' ? parseFloat(formData.valoareTichetDeMasa) : null
    };
    
    // Save to Supabase
    const success = await addEmployee(newEmployee);
    if (!success) {
      alert('Error saving employee. Please try again.');
      return;
    }
    
    // Clear form (this will also recalculate next unique ID)
    handleClear();
    
    // Redirect to home page
    router.push('/');
  };

  const handleClear = async () => {
    setFormData({
      nume: '',
      companie: '',
      principalLocMunca: 'DA',
      persoaneIntretinere: '',
      dinCareMinori: '',
      varsta: '',
      ticheteDeMasa: 'NU',
      valoareTichetDeMasa: ''
    });
    // Recalculate next unique ID after clearing
    const existingEmployees = await getEmployees();
    const nextIdNumber = existingEmployees.length + 1;
    setNextUniqueId(`IDS_${nextIdNumber}`);
  };

  return (
    <main style={{
      padding: '40px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      maxWidth: '1200px',
      margin: '0 auto'
    }}>
      <h1 style={{
        fontSize: '32px',
        fontWeight: '600',
        marginBottom: '32px',
        color: '#1a1a1a'
      }}>
        Adauga angajat
      </h1>
      
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        padding: '40px'
      }}>
        <form onSubmit={handleSubmit}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '200px 1fr',
            gap: '24px 16px',
            alignItems: 'center'
          }}>
            {/* Unique ID Display */}
            <div style={{ gridColumn: '1 / -1', marginBottom: '-16px' }}>
              <div style={{
                color: '#787276',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                Unique ID: {nextUniqueId}
              </div>
            </div>
            
            {/* Nume */}
            <label style={{
              fontWeight: '500',
              color: '#333',
              fontSize: '15px'
            }}>
              Nume
            </label>
            <input
              type="text"
              name="nume"
              value={formData.nume}
              onChange={handleChange}
              style={{
                width: '400px',
                padding: '12px 16px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '15px',
                fontFamily: 'inherit'
              }}
              required
            />

            {/* Companie */}
            <label style={{
              fontWeight: '500',
              color: '#333',
              fontSize: '15px'
            }}>
              Companie
            </label>
            <input
              type="text"
              name="companie"
              value={formData.companie}
              onChange={handleChange}
              style={{
                width: '400px',
                padding: '12px 16px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '15px',
                fontFamily: 'inherit'
              }}
              required
            />

            {/* Principal loc de munca */}
            <label style={{
              fontWeight: '500',
              color: '#333',
              fontSize: '15px'
            }}>
              Acesta este principalul loc de muna (Functia de baza)?
            </label>
            <select
              name="principalLocMunca"
              value={formData.principalLocMunca}
              onChange={handleChange}
              style={{
                width: '120px',
                padding: '12px 16px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '15px',
                fontFamily: 'inherit',
                backgroundColor: 'white',
                cursor: 'pointer'
              }}
              required
            >
              <option value="NU">NU</option>
              <option value="DA">DA</option>
            </select>

            {/* Persoane in intretinere */}
            <label style={{
              fontWeight: '500',
              color: '#333',
              fontSize: '15px'
            }}>
              Persoane in intretinere
            </label>
            <input
              type="number"
              name="persoaneIntretinere"
              value={formData.persoaneIntretinere}
              onChange={handleChange}
              min="0"
              style={{
                width: '120px',
                padding: '12px 16px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '15px',
                fontFamily: 'inherit'
              }}
            />

            {/* din care Minori - sub-category */}
            <label style={{
              fontWeight: '500',
              color: '#333',
              fontSize: '15px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              paddingLeft: '32px'
            }}>
              <span style={{ color: '#808080', fontSize: '14px' }}>→</span>
              din care Minori
            </label>
            <input
              type="number"
              name="dinCareMinori"
              value={formData.dinCareMinori}
              onChange={handleChange}
              min="0"
              style={{
                width: '120px',
                padding: '12px 16px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '15px',
                fontFamily: 'inherit'
              }}
            />

            {/* Varsta */}
            <label style={{
              fontWeight: '500',
              color: '#333',
              fontSize: '15px'
            }}>
              Varsta
            </label>
            <input
              type="number"
              name="varsta"
              value={formData.varsta}
              onChange={handleChange}
              min="0"
              style={{
                width: '120px',
                padding: '12px 16px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '15px',
                fontFamily: 'inherit'
              }}
              required
            />

            {/* Tichete de masa */}
            <label style={{
              fontWeight: '500',
              color: '#333',
              fontSize: '15px'
            }}>
              Tichete de masa
            </label>
            <select
              name="ticheteDeMasa"
              value={formData.ticheteDeMasa}
              onChange={handleChange}
              style={{
                width: '120px',
                padding: '12px 16px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '15px',
                fontFamily: 'inherit',
                backgroundColor: 'white',
                cursor: 'pointer'
              }}
              required
            >
              <option value="NU">NU</option>
              <option value="DA">DA</option>
            </select>

            {/* Valoare tichet de masa - conditional field */}
            {formData.ticheteDeMasa === 'DA' && (
              <>
                <label style={{
                  fontWeight: '500',
                  color: '#333',
                  fontSize: '15px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  paddingLeft: '32px'
                }}>
                  <span style={{ color: '#808080', fontSize: '14px' }}>→</span>
                  Valoare tichet de masa (RON)
                </label>
                <input
                  type="number"
                  name="valoareTichetDeMasa"
                  value={formData.valoareTichetDeMasa}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  style={{
                    width: '120px',
                    padding: '12px 16px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '15px',
                    fontFamily: 'inherit'
                  }}
                  required
                />
              </>
            )}

            {/* Submit button */}
            <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
              <button
                type="button"
                onClick={handleClear}
                style={{
                  padding: '12px 32px',
                  backgroundColor: '#f5f5f5',
                  color: '#333',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '15px',
                  fontWeight: '600',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                }}
              >
                Clear
              </button>
              <button
                type="submit"
                style={{
                  padding: '12px 32px',
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
                Salveaza
              </button>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}

