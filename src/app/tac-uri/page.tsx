'use client';

import { useState, useEffect } from 'react';
import { 
  getTACs, 
  getTACById, 
  getTACRows, 
  saveTAC, 
  updateTAC, 
  deleteTAC,
  getTransactions,
  saveTransaction,
  deleteTransaction,
  getAccountFileEntries,
  saveAccountFileEntries,
  type TAC,
  type TACRow,
  type Transaction
} from '../../lib/db';
import { applyTACToTransaction, type AccountFileEntryResult } from '../../lib/formulaEvaluator';

type ViewMode = 'tacs' | 'transactions' | 'accountFiles';

export default function TACuri() {
  const [viewMode, setViewMode] = useState<ViewMode>('tacs');
  const [tacs, setTACs] = useState<TAC[]>([]);
  const [selectedTAC, setSelectedTAC] = useState<TAC | null>(null);
  const [tacRows, setTACRows] = useState<Omit<TACRow, 'id' | 'tacId'>[]>([]);
  const [isEditingTAC, setIsEditingTAC] = useState(false);
  const [tacName, setTACName] = useState('');
  const [tacDescription, setTACDescription] = useState('');
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isCreatingTransaction, setIsCreatingTransaction] = useState(false);
  const [transactionDate, setTransactionDate] = useState('');
  const [transactionDescription, setTransactionDescription] = useState('');
  const [selectedTACForTransaction, setSelectedTACForTransaction] = useState<number | null>(null);
  const [transactionVariables, setTransactionVariables] = useState<Record<string, string>>({});
  
  const [accountFileEntries, setAccountFileEntries] = useState<AccountFileEntryResult[]>([]);

  useEffect(() => {
    loadTACs();
    loadTransactions();
    initializeSampleTransactions();
  }, []);

  const initializeSampleTransactions = async () => {
    try {
      // Check if transactions already exist
      const existing = await getTransactions();
      if (existing.length > 0) {
        return; // Don't re-add if transactions already exist
      }
    } catch (error) {
      // If table doesn't exist yet, we'll still try to create transactions
      // The saveTransaction function will handle the error
      console.log('Could not check existing transactions, will attempt to create new ones');
    }

    // Sample transactions from the image
    const sampleTransactions = [
      {
        docId: '1122334-0000001',
        description: 'Servicii actualizare site web sept.2025',
        tValFaraTVA: 1200,
        tValTVA: 0,
        tValTotala: 1200,
        tValValuta: null,
        valDed: 1200,
        valNeded: 0,
        tvaDed: 0,
        tacName: 'B1_704'
      },
      {
        docId: '1122334-0000002',
        description: 'Incasare factura ROZ SRL',
        tValFaraTVA: 1200,
        tValTVA: 0,
        tValTotala: 1200,
        tValValuta: null,
        valDed: 1200,
        valNeded: 0,
        tvaDed: 0,
        tacName: 'B1_4111'
      },
      {
        docId: '1122334-0000003',
        description: 'Comisioane bancare',
        tValFaraTVA: 5.5,
        tValTVA: 0,
        tValTotala: 5.5,
        tValValuta: null,
        valDed: 5.5,
        valNeded: 0,
        tvaDed: 0,
        tacName: 'B1_627'
      },
      {
        docId: '1122334-0000004',
        description: 'Avans prestare servicii cf contract 444',
        tValFaraTVA: 4000,
        tValTVA: 0,
        tValTotala: 4000,
        tValValuta: null,
        valDed: 4000,
        valNeded: 0,
        tvaDed: 0,
        tacName: 'B1_419'
      },
      {
        docId: '1122334-0000005',
        description: 'Incasare factura VULCAN SRL',
        tValFaraTVA: 4000,
        tValTVA: 0,
        tValTotala: 4000,
        tValValuta: null,
        valDed: 4000,
        valNeded: 0,
        tvaDed: 0,
        tacName: 'B1_4111'
      },
      {
        docId: '1122334-0000006',
        description: 'Asigurare auto RCA',
        tValFaraTVA: 880,
        tValTVA: 0,
        tValTotala: 880,
        tValValuta: null,
        valDed: 440,
        valNeded: 440,
        tvaDed: 0,
        tacName: 'B1_613'
      },
      {
        docId: '1122334-0000007',
        description: 'Parcare',
        tValFaraTVA: 20,
        tValTVA: 4.2,
        tValTotala: 24.2,
        tValValuta: null,
        valDed: 24.2,
        valNeded: 0,
        tvaDed: 0,
        tacName: 'B1_625'
      },
      {
        docId: '1122334-0000008',
        description: 'Energie electrica',
        tValFaraTVA: 400,
        tValTVA: 84,
        tValTotala: 484,
        tValValuta: null,
        valDed: 484,
        valNeded: 0,
        tvaDed: 0,
        tacName: 'B1_6051'
      },
      {
        docId: '1122334-0000009',
        description: 'Combustibil',
        tValFaraTVA: 320.65,
        tValTVA: 67.34,
        tValTotala: 387.99,
        tValValuta: null,
        valDed: 193.99,
        valNeded: 193.99,
        tvaDed: 0,
        tacName: 'B1_6022'
      },
      {
        docId: '1122334-0000010',
        description: 'Plata utilitati',
        tValFaraTVA: 484,
        tValTVA: 0,
        tValTotala: 484,
        tValValuta: null,
        valDed: 484,
        valNeded: 0,
        tvaDed: 0,
        tacName: 'B1_401'
      }
    ];

    try {
      // Get all TACs to find matching IDs
      const allTACs = await getTACs();
      const tacMap: Record<string, number | undefined> = {};
      allTACs.forEach(tac => {
        tacMap[tac.name] = tac.id;
      });

      // Save each transaction
      const today = new Date().toISOString().split('T')[0];
      let successCount = 0;
      for (const t of sampleTransactions) {
        try {
          const transactionId = await saveTransaction({
            tacId: tacMap[t.tacName],
            transactionDate: today,
            description: `${t.docId} - ${t.description}`,
            variables: {
              Doc_ID: t.docId,
              T_Descriere_L1: t.description,
              T_Val_fara_TVA: t.tValFaraTVA,
              T_Val_TVA: t.tValTVA,
              T_Val_Totala: t.tValTotala,
              T_Val_Valuta: t.tValValuta,
              Val_ded: t.valDed,
              Val_neded: t.valNeded,
              TVA_ded: t.tvaDed,
              ID_Tranzactie: t.tacName,
              'T.Val_Valuta': t.tValValuta,
              'T.Moneda': null
            }
          });
          if (transactionId) {
            successCount++;
          }
        } catch (err) {
          console.error(`Error saving transaction ${t.docId}:`, err);
        }
      }

      console.log(`Successfully saved ${successCount} out of ${sampleTransactions.length} transactions`);

      // Reload transactions to display them
      await loadTransactions();
    } catch (error) {
      console.error('Error initializing sample transactions:', error);
    }
  };

  useEffect(() => {
    if (selectedTAC) {
      loadTACRows(selectedTAC.id);
    }
  }, [selectedTAC]);

  const loadTACs = async () => {
    const loadedTACs = await getTACs();
    setTACs(loadedTACs);
  };

  const loadTACRows = async (tacId: number) => {
    const rows = await getTACRows(tacId);
    setTACRows(rows.map(r => ({
      fisaCont: r.fisaCont,
      contCorespondent: r.contCorespondent,
      debitFormula: r.debitFormula,
      creditFormula: r.creditFormula,
      valutaFormula: r.valutaFormula,
      monedaValutaFormula: r.monedaValutaFormula,
      rowOrder: r.rowOrder
    })));
  };

  const loadTransactions = async () => {
    const loaded = await getTransactions();
    setTransactions(loaded);
  };

  const handleCreateTAC = () => {
    setSelectedTAC(null);
    setTACName('');
    setTACDescription('');
    setTACRows([]);
    setIsEditingTAC(true);
  };

  const handleEditTAC = async (tac: TAC) => {
    setSelectedTAC(tac);
    setTACName(tac.name);
    setTACDescription(tac.description || '');
    await loadTACRows(tac.id);
    setIsEditingTAC(true);
  };

  const handleSaveTAC = async () => {
    if (!tacName.trim()) {
      alert('Please enter a TAC name');
      return;
    }

    if (selectedTAC) {
      const success = await updateTAC(selectedTAC.id, {
        name: tacName,
        description: tacDescription
      }, tacRows);
      
      if (success) {
        setIsEditingTAC(false);
        await loadTACs();
        alert('TAC updated successfully');
      } else {
        alert('Error updating TAC');
      }
    } else {
      const id = await saveTAC({
        name: tacName,
        description: tacDescription
      }, tacRows);
      
      if (id) {
        setIsEditingTAC(false);
        await loadTACs();
        alert('TAC created successfully');
      } else {
        alert('Error creating TAC');
      }
    }
  };

  const handleDeleteTAC = async (id: number) => {
    if (!confirm('Are you sure you want to delete this TAC?')) {
      return;
    }
    
    const success = await deleteTAC(id);
    if (success) {
      await loadTACs();
      if (selectedTAC?.id === id) {
        setSelectedTAC(null);
        setTACRows([]);
      }
    } else {
      alert('Error deleting TAC');
    }
  };

  const handleAddTACRow = () => {
    setTACRows([...tacRows, {
      fisaCont: '',
      contCorespondent: '',
      debitFormula: '',
      creditFormula: '',
      valutaFormula: '',
      monedaValutaFormula: '',
      rowOrder: tacRows.length
    }]);
  };

  const handleRemoveTACRow = (index: number) => {
    setTACRows(tacRows.filter((_, i) => i !== index));
  };

  const handleUpdateTACRow = (index: number, field: keyof Omit<TACRow, 'id' | 'tacId'>, value: string | number) => {
    const updated = [...tacRows];
    updated[index] = { ...updated[index], [field]: value };
    setTACRows(updated);
  };

  const handleCreateTransaction = () => {
    setIsCreatingTransaction(true);
    setTransactionDate(new Date().toISOString().split('T')[0]);
    setTransactionDescription('');
    setSelectedTACForTransaction(null);
    setTransactionVariables({});
  };

  const handleSaveTransaction = async () => {
    if (!transactionDate) {
      alert('Please enter a transaction date');
      return;
    }

    if (!selectedTACForTransaction) {
      alert('Please select a TAC');
      return;
    }

    // Convert string values to numbers where appropriate
    const variables: Record<string, any> = {};
    for (const [key, value] of Object.entries(transactionVariables)) {
      const numValue = parseFloat(value);
      variables[key] = isNaN(numValue) ? value : numValue;
    }

    const transactionId = await saveTransaction({
      tacId: selectedTACForTransaction,
      transactionDate,
      description: transactionDescription,
      variables
    });

    if (transactionId) {
      // Apply TAC to generate account file entries
      const tac = await getTACById(selectedTACForTransaction);
      if (tac) {
        const rows = await getTACRows(selectedTACForTransaction);
        const entries = applyTACToTransaction(rows.map(r => ({
          fisaCont: r.fisaCont,
          contCorespondent: r.contCorespondent,
          debitFormula: r.debitFormula,
          creditFormula: r.creditFormula,
          valutaFormula: r.valutaFormula,
          monedaValutaFormula: r.monedaValutaFormula
        })), variables);

        await saveAccountFileEntries(entries.map(e => ({
          transactionId,
          fisaCont: e.fisaCont,
          contCorespondent: e.contCorespondent,
          debit: e.debit,
          credit: e.credit,
          valuta: e.valuta,
          monedaValuta: e.monedaValuta
        })));
      }

      setIsCreatingTransaction(false);
      await loadTransactions();
      alert('Transaction created and account file entries generated successfully');
    } else {
      alert('Error creating transaction');
    }
  };

  const handleViewAccountFile = async (transactionId: number) => {
    const entries = await getAccountFileEntries(transactionId);
    setAccountFileEntries(entries.map(e => ({
      fisaCont: e.fisaCont,
      contCorespondent: e.contCorespondent,
      debit: e.debit,
      credit: e.credit,
      valuta: e.valuta,
      monedaValuta: e.monedaValuta
    })));
    setViewMode('accountFiles');
    setSelectedTransaction(transactions.find(t => t.id === transactionId) || null);
  };

  const handleDeleteTransaction = async (id: number) => {
    if (!confirm('Are you sure you want to delete this transaction?')) {
      return;
    }
    
    const success = await deleteTransaction(id);
    if (success) {
      await loadTransactions();
    } else {
      alert('Error deleting transaction');
    }
  };


  const addTransactionVariable = () => {
    const key = prompt('Enter variable name:');
    if (key) {
      setTransactionVariables({ ...transactionVariables, [key]: '' });
    }
  };

  const removeTransactionVariable = (key: string) => {
    const updated = { ...transactionVariables };
    delete updated[key];
    setTransactionVariables(updated);
  };

  return (
    <main style={{
      padding: '40px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      maxWidth: '1400px',
      margin: '0 auto'
    }}>
      <h1 style={{
        fontSize: '32px',
        fontWeight: '600',
        marginBottom: '32px',
        color: '#1a1a1a'
      }}>
        TAC-uri
      </h1>

      {/* Navigation Tabs */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '24px',
        borderBottom: '2px solid #e0e0e0'
      }}>
        <button
          onClick={() => setViewMode('tacs')}
          style={{
            padding: '12px 24px',
            backgroundColor: viewMode === 'tacs' ? '#D66185' : 'transparent',
            color: viewMode === 'tacs' ? 'white' : '#333',
            border: 'none',
            borderBottom: viewMode === 'tacs' ? '2px solid #D66185' : '2px solid transparent',
            cursor: 'pointer',
            fontSize: '15px',
            fontWeight: '500',
            marginBottom: '-2px'
          }}
        >
          TAC-uri
        </button>
        <button
          onClick={() => setViewMode('transactions')}
          style={{
            padding: '12px 24px',
            backgroundColor: viewMode === 'transactions' ? '#D66185' : 'transparent',
            color: viewMode === 'transactions' ? 'white' : '#333',
            border: 'none',
            borderBottom: viewMode === 'transactions' ? '2px solid #D66185' : '2px solid transparent',
            cursor: 'pointer',
            fontSize: '15px',
            fontWeight: '500',
            marginBottom: '-2px'
          }}
        >
          Tranzacții
        </button>
        <button
          onClick={() => setViewMode('accountFiles')}
          style={{
            padding: '12px 24px',
            backgroundColor: viewMode === 'accountFiles' ? '#D66185' : 'transparent',
            color: viewMode === 'accountFiles' ? 'white' : '#333',
            border: 'none',
            borderBottom: viewMode === 'accountFiles' ? '2px solid #D66185' : '2px solid transparent',
            cursor: 'pointer',
            fontSize: '15px',
            fontWeight: '500',
            marginBottom: '-2px'
          }}
        >
          Fișe Cont
        </button>
      </div>

      {/* TACs View */}
      {viewMode === 'tacs' && (
        <div>
          {!isEditingTAC ? (
            <>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '24px'
              }}>
                <h2 style={{ fontSize: '24px', fontWeight: '600', margin: 0 }}>Lista TAC-uri</h2>
                <button
                  onClick={handleCreateTAC}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#D66185',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}
                >
                  + Adaugă TAC
                </button>
              </div>

              <div style={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                overflow: 'hidden'
              }}>
                {tacs.length === 0 ? (
                  <div style={{ padding: '40px', textAlign: 'center', color: '#808080' }}>
                    Nu există TAC-uri. Creează primul TAC.
                  </div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '2px solid #e0e0e0' }}>
                        <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600' }}>Nume</th>
                        <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600' }}>Descriere</th>
                        <th style={{ padding: '16px', textAlign: 'right', fontWeight: '600' }}>Acțiuni</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tacs.map((tac) => (
                        <tr key={tac.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                          <td style={{ padding: '16px' }}>{tac.name}</td>
                          <td style={{ padding: '16px', color: '#666' }}>{tac.description || '-'}</td>
                          <td style={{ padding: '16px', textAlign: 'right' }}>
                            <button
                              onClick={() => handleEditTAC(tac)}
                              style={{
                                padding: '6px 12px',
                                marginRight: '8px',
                                backgroundColor: 'transparent',
                                color: '#D66185',
                                border: '1px solid #D66185',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '13px'
                              }}
                            >
                              Editează
                            </button>
                            <button
                              onClick={() => handleDeleteTAC(tac.id)}
                              style={{
                                padding: '6px 12px',
                                backgroundColor: 'transparent',
                                color: '#dc3545',
                                border: '1px solid #dc3545',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '13px'
                              }}
                            >
                              Șterge
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          ) : (
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              padding: '32px'
            }}>
              <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '24px' }}>
                {selectedTAC ? 'Editează TAC' : 'Creează TAC nou'}
              </h2>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  Nume TAC *
                </label>
                <input
                  type="text"
                  value={tacName}
                  onChange={(e) => setTACName(e.target.value)}
                  style={{
                    width: '100%',
                    maxWidth: '500px',
                    padding: '10px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '15px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  Descriere
                </label>
                <input
                  type="text"
                  value={tacDescription}
                  onChange={(e) => setTACDescription(e.target.value)}
                  style={{
                    width: '100%',
                    maxWidth: '500px',
                    padding: '10px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '15px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>Rânduri TAC</h3>
                  <button
                    onClick={handleAddTACRow}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#D66185',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}
                  >
                    + Adaugă Rând
                  </button>
                </div>

                {tacRows.length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#808080', backgroundColor: '#f9f9f9', borderRadius: '6px' }}>
                    Nu există rânduri. Adaugă primul rând.
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#f5f5f5' }}>
                          <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Fisa Cont</th>
                          <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Cont Corespondent</th>
                          <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>DEBIT (formulă)</th>
                          <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>CREDIT (formulă)</th>
                          <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Valuta (formulă)</th>
                          <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Moneda Valuta (formulă)</th>
                          <th style={{ padding: '12px', textAlign: 'center', border: '1px solid #ddd' }}>Acțiuni</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tacRows.map((row, index) => (
                          <tr key={index}>
                            <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                              <input
                                type="text"
                                value={row.fisaCont}
                                onChange={(e) => handleUpdateTACRow(index, 'fisaCont', e.target.value)}
                                style={{ width: '100%', padding: '6px', border: '1px solid #ccc', borderRadius: '4px' }}
                                placeholder="628"
                              />
                            </td>
                            <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                              <input
                                type="text"
                                value={row.contCorespondent || ''}
                                onChange={(e) => handleUpdateTACRow(index, 'contCorespondent', e.target.value)}
                                style={{ width: '100%', padding: '6px', border: '1px solid #ccc', borderRadius: '4px' }}
                                placeholder="401"
                              />
                            </td>
                            <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                              <input
                                type="text"
                                value={row.debitFormula || ''}
                                onChange={(e) => handleUpdateTACRow(index, 'debitFormula', e.target.value)}
                                style={{ width: '100%', padding: '6px', border: '1px solid #ccc', borderRadius: '4px' }}
                                placeholder="Val_ded + Val_neded"
                              />
                            </td>
                            <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                              <input
                                type="text"
                                value={row.creditFormula || ''}
                                onChange={(e) => handleUpdateTACRow(index, 'creditFormula', e.target.value)}
                                style={{ width: '100%', padding: '6px', border: '1px solid #ccc', borderRadius: '4px' }}
                                placeholder=""
                              />
                            </td>
                            <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                              <input
                                type="text"
                                value={row.valutaFormula || ''}
                                onChange={(e) => handleUpdateTACRow(index, 'valutaFormula', e.target.value)}
                                style={{ width: '100%', padding: '6px', border: '1px solid #ccc', borderRadius: '4px' }}
                                placeholder="T.Val_Valuta"
                              />
                            </td>
                            <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                              <input
                                type="text"
                                value={row.monedaValutaFormula || ''}
                                onChange={(e) => handleUpdateTACRow(index, 'monedaValutaFormula', e.target.value)}
                                style={{ width: '100%', padding: '6px', border: '1px solid #ccc', borderRadius: '4px' }}
                                placeholder="T.Moneda"
                              />
                            </td>
                            <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>
                              <button
                                onClick={() => handleRemoveTACRow(index)}
                                style={{
                                  padding: '4px 8px',
                                  backgroundColor: '#dc3545',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontSize: '12px'
                                }}
                              >
                                Șterge
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={handleSaveTAC}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: '#D66185',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '15px',
                    fontWeight: '600'
                  }}
                >
                  Salvează
                </button>
                <button
                  onClick={() => {
                    setIsEditingTAC(false);
                    setSelectedTAC(null);
                    setTACRows([]);
                  }}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: '#f5f5f5',
                    color: '#333',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '15px',
                    fontWeight: '600'
                  }}
                >
                  Anulează
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Transactions View */}
      {viewMode === 'transactions' && (
        <div>
          {!isCreatingTransaction ? (
            <>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '24px'
              }}>
                <h2 style={{ fontSize: '24px', fontWeight: '600', margin: 0 }}>Tranzacții</h2>
                <button
                  onClick={handleCreateTransaction}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#D66185',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}
                >
                  + Adaugă Tranzacție
                </button>
              </div>

              <div style={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                overflow: 'hidden'
              }}>
                {transactions.length === 0 ? (
                  <div style={{ padding: '40px', textAlign: 'center', color: '#808080' }}>
                    Nu există tranzacții. Creează prima tranzacție.
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '2px solid #e0e0e0' }}>
                          <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', whiteSpace: 'nowrap' }}>Doc_ID</th>
                          <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', whiteSpace: 'nowrap' }}>Descriere</th>
                          <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600', whiteSpace: 'nowrap' }}>T_Val_fara_TVA</th>
                          <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600', whiteSpace: 'nowrap' }}>T_Val_TVA</th>
                          <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600', whiteSpace: 'nowrap' }}>T_Val_Totala</th>
                          <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600', whiteSpace: 'nowrap' }}>T_Val_Valuta</th>
                          <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600', whiteSpace: 'nowrap' }}>Val_ded</th>
                          <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600', whiteSpace: 'nowrap' }}>Val_neded</th>
                          <th style={{ padding: '12px', textAlign: 'right', fontWeight: '600', whiteSpace: 'nowrap' }}>TVA_ded</th>
                          <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', whiteSpace: 'nowrap' }}>ID_Tranzactie</th>
                          <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600', whiteSpace: 'nowrap' }}>Acțiuni</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transactions.map((transaction, index) => {
                          const vars = transaction.variables || {};
                          const tValFaraTVA = vars.T_Val_fara_TVA || 0;
                          const tValTVA = vars.T_Val_TVA || 0;
                          const tValTotala = vars.T_Val_Totala || 0;
                          const tValValuta = vars.T_Val_Valuta || null;
                          const valDed = vars.Val_ded || 0;
                          const valNeded = vars.Val_neded || 0;
                          const tvaDed = vars.TVA_ded || 0;
                          const docId = vars.Doc_ID || '-';
                          const tacName = vars.ID_Tranzactie || '-';
                          const description = vars.T_Descriere_L1 || transaction.description || '-';
                          
                          return (
                            <tr 
                              key={transaction.id} 
                              style={{ 
                                borderBottom: '1px solid #f0f0f0',
                                backgroundColor: index % 2 === 0 ? '#ffffff' : '#f9f9f9'
                              }}
                            >
                              <td style={{ padding: '12px' }}>{docId}</td>
                              <td style={{ padding: '12px', maxWidth: '300px' }}>{description}</td>
                              <td style={{ padding: '12px', textAlign: 'right' }}>{typeof tValFaraTVA === 'number' ? tValFaraTVA.toFixed(2) : tValFaraTVA}</td>
                              <td style={{ padding: '12px', textAlign: 'right' }}>{typeof tValTVA === 'number' ? (tValTVA === 0 ? '' : tValTVA.toFixed(2)) : tValTVA || ''}</td>
                              <td style={{ padding: '12px', textAlign: 'right' }}>{typeof tValTotala === 'number' ? tValTotala.toFixed(2) : tValTotala}</td>
                              <td style={{ padding: '12px', textAlign: 'right' }}>{tValValuta ? (typeof tValValuta === 'number' ? tValValuta.toFixed(2) : tValValuta) : ''}</td>
                              <td style={{ padding: '12px', textAlign: 'right' }}>{typeof valDed === 'number' ? valDed.toFixed(2) : valDed}</td>
                              <td style={{ padding: '12px', textAlign: 'right' }}>{typeof valNeded === 'number' ? (valNeded === 0 ? '' : valNeded.toFixed(2)) : valNeded || ''}</td>
                              <td style={{ padding: '12px', textAlign: 'right' }}>{typeof tvaDed === 'number' ? (tvaDed === 0 ? '' : tvaDed.toFixed(2)) : tvaDed || ''}</td>
                              <td style={{ padding: '12px' }}>{tacName}</td>
                              <td style={{ padding: '12px', textAlign: 'center' }}>
                                <button
                                  onClick={() => handleViewAccountFile(transaction.id)}
                                  style={{
                                    padding: '4px 8px',
                                    marginRight: '4px',
                                    backgroundColor: 'transparent',
                                    color: '#D66185',
                                    border: '1px solid #D66185',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '12px'
                                  }}
                                >
                                  Fișă
                                </button>
                                <button
                                  onClick={() => handleDeleteTransaction(transaction.id)}
                                  style={{
                                    padding: '4px 8px',
                                    backgroundColor: 'transparent',
                                    color: '#dc3545',
                                    border: '1px solid #dc3545',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '12px'
                                  }}
                                >
                                  Șterge
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              padding: '32px'
            }}>
              <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '24px' }}>
                Creează Tranzacție nouă
              </h2>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  Data tranzacției *
                </label>
                <input
                  type="date"
                  value={transactionDate}
                  onChange={(e) => setTransactionDate(e.target.value)}
                  style={{
                    width: '100%',
                    maxWidth: '300px',
                    padding: '10px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '15px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  Descriere
                </label>
                <input
                  type="text"
                  value={transactionDescription}
                  onChange={(e) => setTransactionDescription(e.target.value)}
                  style={{
                    width: '100%',
                    maxWidth: '500px',
                    padding: '10px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '15px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  TAC *
                </label>
                <select
                  value={selectedTACForTransaction || ''}
                  onChange={(e) => setSelectedTACForTransaction(parseInt(e.target.value))}
                  style={{
                    width: '100%',
                    maxWidth: '500px',
                    padding: '10px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '15px',
                    backgroundColor: 'white'
                  }}
                >
                  <option value="">Selectează TAC</option>
                  {tacs.map(tac => (
                    <option key={tac.id} value={tac.id}>{tac.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <label style={{ fontWeight: '500' }}>Variabile tranzacție</label>
                  <button
                    onClick={addTransactionVariable}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: '#D66185',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '13px'
                    }}
                  >
                    + Adaugă Variabilă
                  </button>
                </div>
                {Object.keys(transactionVariables).length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#808080', backgroundColor: '#f9f9f9', borderRadius: '6px' }}>
                    Nu există variabile. Adaugă variabile pentru tranzacție (ex: Val_ded, Val_neded, TVA_ded, etc.)
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {Object.entries(transactionVariables).map(([key, value]) => (
                      <div key={key} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <input
                          type="text"
                          value={key}
                          readOnly
                          style={{
                            padding: '8px 12px',
                            border: '1px solid #ddd',
                            borderRadius: '6px',
                            fontSize: '14px',
                            backgroundColor: '#f5f5f5',
                            width: '200px'
                          }}
                        />
                        <input
                          type="text"
                          value={value}
                          onChange={(e) => setTransactionVariables({ ...transactionVariables, [key]: e.target.value })}
                          placeholder="Valoare"
                          style={{
                            padding: '8px 12px',
                            border: '1px solid #ddd',
                            borderRadius: '6px',
                            fontSize: '14px',
                            flex: 1
                          }}
                        />
                        <button
                          onClick={() => removeTransactionVariable(key)}
                          style={{
                            padding: '8px 12px',
                            backgroundColor: '#dc3545',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '13px'
                          }}
                        >
                          Șterge
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={handleSaveTransaction}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: '#D66185',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '15px',
                    fontWeight: '600'
                  }}
                >
                  Salvează și Generează Fișă Cont
                </button>
                <button
                  onClick={() => setIsCreatingTransaction(false)}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: '#f5f5f5',
                    color: '#333',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '15px',
                    fontWeight: '600'
                  }}
                >
                  Anulează
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Account Files View */}
      {viewMode === 'accountFiles' && (
        <div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px'
          }}>
            <h2 style={{ fontSize: '24px', fontWeight: '600', margin: 0 }}>
              Fișe Cont {selectedTransaction && `- ${selectedTransaction.description || selectedTransaction.transactionDate}`}
            </h2>
            {selectedTransaction && (
              <button
                onClick={() => setViewMode('transactions')}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#f5f5f5',
                  color: '#333',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                ← Înapoi la Tranzacții
              </button>
            )}
          </div>

          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            overflow: 'hidden'
          }}>
            {accountFileEntries.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#808080' }}>
                Nu există intrări în fișă cont. Creează o tranzacție și aplică un TAC pentru a genera intrări.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f5f5f5', borderBottom: '2px solid #e0e0e0' }}>
                      <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600' }}>Fisa Cont</th>
                      <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600' }}>Cont Corespondent</th>
                      <th style={{ padding: '16px', textAlign: 'right', fontWeight: '600' }}>DEBIT</th>
                      <th style={{ padding: '16px', textAlign: 'right', fontWeight: '600' }}>CREDIT</th>
                      <th style={{ padding: '16px', textAlign: 'right', fontWeight: '600' }}>Valuta</th>
                      <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600' }}>Moneda Valuta</th>
                    </tr>
                  </thead>
                  <tbody>
                    {accountFileEntries.map((entry, index) => (
                      <tr key={index} style={{ borderBottom: '1px solid #f0f0f0' }}>
                        <td style={{ padding: '16px' }}>{entry.fisaCont}</td>
                        <td style={{ padding: '16px' }}>{entry.contCorespondent || '-'}</td>
                        <td style={{ padding: '16px', textAlign: 'right' }}>{entry.debit.toFixed(2)}</td>
                        <td style={{ padding: '16px', textAlign: 'right' }}>{entry.credit.toFixed(2)}</td>
                        <td style={{ padding: '16px', textAlign: 'right' }}>{entry.valuta?.toFixed(2) || '-'}</td>
                        <td style={{ padding: '16px' }}>{entry.monedaValuta || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
