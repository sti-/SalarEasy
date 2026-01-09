'use client';

import { generateDeducereTable } from '../utils/deducereLookup';

export default function DeducerePersonalaOUG162022() {
  const tableData = generateDeducereTable();

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
        Deducere personala - OUG 16/2022
      </h1>
      
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        padding: '40px',
        overflowX: 'auto'
      }}>
        <h2 style={{
          fontSize: '24px',
          fontWeight: '600',
          marginBottom: '24px',
          color: '#1a1a1a'
        }}>
          Persoane in intretinere
        </h2>
        
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '14px'
        }}>
          <thead>
            <tr style={{
              backgroundColor: '#f5f5f5',
              borderBottom: '2px solid #e0e0e0'
            }}>
              <th style={{
                padding: '12px 16px',
                textAlign: 'center',
                fontWeight: '600',
                color: '#333',
                borderRight: '1px solid #e0e0e0',
                minWidth: '60px'
              }}>
                Row
              </th>
              <th colSpan={2} style={{
                padding: '12px 16px',
                textAlign: 'center',
                fontWeight: '600',
                color: '#333',
                borderRight: '1px solid #e0e0e0'
              }}>
                Venit brut lunar
              </th>
              <th colSpan={5} style={{
                padding: '12px 16px',
                textAlign: 'center',
                fontWeight: '600',
                color: '#333'
              }}>
                Persoane in intretinere
              </th>
            </tr>
            <tr style={{
              backgroundColor: '#fafafa',
              borderBottom: '2px solid #e0e0e0'
            }}>
              <th style={{
                padding: '12px 16px',
                textAlign: 'center',
                fontWeight: '600',
                color: '#333',
                fontSize: '12px',
                borderRight: '1px solid #e0e0e0'
              }}>
                #
              </th>
              <th style={{
                padding: '12px 16px',
                textAlign: 'center',
                fontWeight: '600',
                color: '#333',
                fontSize: '12px',
                borderRight: '1px solid #e0e0e0'
              }}>
                De la
              </th>
              <th style={{
                padding: '12px 16px',
                textAlign: 'center',
                fontWeight: '600',
                color: '#333',
                fontSize: '12px',
                borderRight: '1px solid #e0e0e0'
              }}>
                Pana la
              </th>
              <th style={{
                padding: '12px 16px',
                textAlign: 'center',
                fontWeight: '600',
                color: '#333',
                fontSize: '12px',
                borderRight: '1px solid #e0e0e0'
              }}>
                0
              </th>
              <th style={{
                padding: '12px 16px',
                textAlign: 'center',
                fontWeight: '600',
                color: '#333',
                fontSize: '12px',
                borderRight: '1px solid #e0e0e0'
              }}>
                1
              </th>
              <th style={{
                padding: '12px 16px',
                textAlign: 'center',
                fontWeight: '600',
                color: '#333',
                fontSize: '12px',
                borderRight: '1px solid #e0e0e0'
              }}>
                2
              </th>
              <th style={{
                padding: '12px 16px',
                textAlign: 'center',
                fontWeight: '600',
                color: '#333',
                fontSize: '12px',
                borderRight: '1px solid #e0e0e0'
              }}>
                3
              </th>
              <th style={{
                padding: '12px 16px',
                textAlign: 'center',
                fontWeight: '600',
                color: '#333',
                fontSize: '12px'
              }}>
                4+
              </th>
            </tr>
          </thead>
          <tbody>
            {tableData.map((row, index) => (
              <tr
                key={row.row}
                style={{
                  borderBottom: '1px solid #f0f0f0',
                  backgroundColor: index % 2 === 0 ? '#ffffff' : '#fafafa'
                }}
              >
                <td style={{
                  padding: '10px 16px',
                  textAlign: 'center',
                  color: '#333',
                  borderRight: '1px solid #e0e0e0',
                  fontWeight: '500'
                }}>
                  {row.row}
                </td>
                <td style={{
                  padding: '10px 16px',
                  textAlign: 'right',
                  color: '#333',
                  borderRight: '1px solid #e0e0e0'
                }}>
                  {row.from.toLocaleString()}
                </td>
                <td style={{
                  padding: '10px 16px',
                  textAlign: 'right',
                  color: '#333',
                  borderRight: '1px solid #e0e0e0'
                }}>
                  {row.to.toLocaleString()}
                </td>
                <td style={{
                  padding: '10px 16px',
                  textAlign: 'center',
                  color: '#333',
                  borderRight: '1px solid #e0e0e0'
                }}>
                  {row.dependents0 > 0 ? `${row.dependents0.toFixed(1)}%` : '-'}
                </td>
                <td style={{
                  padding: '10px 16px',
                  textAlign: 'center',
                  color: '#333',
                  borderRight: '1px solid #e0e0e0'
                }}>
                  {row.dependents1 > 0 ? `${row.dependents1.toFixed(1)}%` : '-'}
                </td>
                <td style={{
                  padding: '10px 16px',
                  textAlign: 'center',
                  color: '#333',
                  borderRight: '1px solid #e0e0e0'
                }}>
                  {row.dependents2 > 0 ? `${row.dependents2.toFixed(1)}%` : '-'}
                </td>
                <td style={{
                  padding: '10px 16px',
                  textAlign: 'center',
                  color: '#333',
                  borderRight: '1px solid #e0e0e0'
                }}>
                  {row.dependents3 > 0 ? `${row.dependents3.toFixed(1)}%` : '-'}
                </td>
                <td style={{
                  padding: '10px 16px',
                  textAlign: 'center',
                  color: '#333'
                }}>
                  {row.dependents4Plus > 0 ? `${row.dependents4Plus.toFixed(1)}%` : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}

