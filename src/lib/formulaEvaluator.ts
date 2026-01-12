/**
 * Formula Evaluator for TAC formulas
 * Supports variables like Val_ded, Val_neded, TVA_ded, T.Val_Valuta, T.Moneda, etc.
 */

export interface FormulaContext {
  [key: string]: any;
}

/**
 * Evaluates a formula string with the given context variables
 * Supports basic arithmetic operations: +, -, *, /
 * Variables can be accessed directly (e.g., Val_ded) or with dot notation (e.g., T.Val_Valuta)
 * 
 * @param formula - The formula string to evaluate (e.g., "Val_ded + Val_neded")
 * @param context - Object containing variable values
 * @returns The evaluated result as a number, string, or null
 */
export function evaluateFormula(formula: string | null | undefined, context: FormulaContext): number | string | null {
  if (!formula || formula.trim() === '') {
    return null;
  }

  const trimmedFormula = formula.trim();

  // Replace variable references with their values
  let expression = trimmedFormula;
  let isStringResult = false;
  let stringResult: string | null = null;
  
  // First, replace variables that might be in dot notation (e.g., T.Val_Valuta)
  // We need to handle these before simple variable names
  const dotNotationRegex = /([A-Za-z_][A-Za-z0-9_]*\.[A-Za-z_][A-Za-z0-9_]*)/g;
  const dotMatches = expression.match(dotNotationRegex);
  
  if (dotMatches) {
    dotMatches.forEach(match => {
      const value = getNestedValue(context, match);
      if (value !== undefined && value !== null) {
        // If it's a string, we need to handle it differently
        if (typeof value === 'string') {
          // For string values, if the entire expression is just this variable, return it
          if (expression.trim() === match) {
            isStringResult = true;
            stringResult = value;
            return;
          }
          // Otherwise, we can't do arithmetic with strings, so convert to 0
          expression = expression.replace(new RegExp(match.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), '0');
        } else {
          expression = expression.replace(new RegExp(match.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), String(value));
        }
      } else {
        expression = expression.replace(new RegExp(match.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), '0');
      }
    });
  }

  // If we determined it's a string result, return it
  if (isStringResult && stringResult !== null) {
    return stringResult;
  }

  // Then replace simple variable names (e.g., Val_ded, TVA_ded)
  // Only replace if they're not part of a dot notation that was already replaced
  const simpleVarRegex = /\b([A-Za-z_][A-Za-z0-9_]*)\b/g;
  const simpleMatches = expression.match(simpleVarRegex);
  
  if (simpleMatches) {
    simpleMatches.forEach(match => {
      // Skip if it's a number or operator
      if (!isNaN(Number(match)) || ['+', '-', '*', '/', '(', ')'].includes(match)) {
        return;
      }
      
      // Skip if it was already replaced as part of dot notation
      if (dotMatches && dotMatches.some(dm => dm.includes(match))) {
        return;
      }

      const value = context[match];
      if (value !== undefined && value !== null) {
        if (typeof value === 'string') {
          // If the entire expression is just this variable, return it
          if (expression.trim() === match) {
            isStringResult = true;
            stringResult = value;
            return;
          }
          expression = expression.replace(new RegExp(`\\b${match}\\b`, 'g'), '0');
        } else {
          expression = expression.replace(new RegExp(`\\b${match}\\b`, 'g'), String(value));
        }
      } else {
        expression = expression.replace(new RegExp(`\\b${match}\\b`, 'g'), '0');
      }
    });
  }

  // If we determined it's a string result, return it
  if (isStringResult && stringResult !== null) {
    return stringResult;
  }

  // If after replacement the expression is just a string variable, return it
  if (expression.match(/^[A-Za-z_][A-Za-z0-9_]*$/)) {
    const value = context[expression];
    if (typeof value === 'string') {
      return value;
    }
  }

  // Evaluate the mathematical expression
  try {
    // Sanitize: only allow numbers, operators, parentheses, decimal points, and spaces
    const sanitized = expression.replace(/[^0-9+\-*/().\s]/g, '');
    
    // Check if expression is empty or invalid
    if (!sanitized.trim()) {
      return null;
    }
    
    // Use Function constructor for safe evaluation
    // This is safe because we've sanitized the input to only contain numbers and operators
    const result = new Function(`"use strict"; return (${sanitized})`)();
    
    if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
      return result;
    }
    
    return null;
  } catch (error) {
    console.error('Error evaluating formula:', formula, error);
    return null;
  }
}

/**
 * Gets a nested value from an object using dot notation
 * e.g., getNestedValue({T: {Val_Valuta: 100}}, "T.Val_Valuta") returns 100
 */
function getNestedValue(obj: any, path: string): any {
  const parts = path.split('.');
  let current = obj;
  
  for (const part of parts) {
    if (current === null || current === undefined) {
      return undefined;
    }
    current = current[part];
  }
  
  return current;
}

/**
 * Applies a TAC to a transaction and generates account file entries
 */
export interface TACRow {
  fisaCont: string;
  contCorespondent?: string;
  debitFormula?: string;
  creditFormula?: string;
  valutaFormula?: string;
  monedaValutaFormula?: string;
}

export interface AccountFileEntryResult {
  fisaCont: string;
  contCorespondent?: string;
  debit: number;
  credit: number;
  valuta?: number;
  monedaValuta?: string;
}

export function applyTACToTransaction(
  tacRows: TACRow[],
  transactionVariables: FormulaContext
): AccountFileEntryResult[] {
  const entries: AccountFileEntryResult[] = [];

  for (const row of tacRows) {
    const debit = evaluateFormula(row.debitFormula, transactionVariables);
    const credit = evaluateFormula(row.creditFormula, transactionVariables);
    const valuta = evaluateFormula(row.valutaFormula, transactionVariables);
    const monedaValuta = evaluateFormula(row.monedaValutaFormula, transactionVariables);

    entries.push({
      fisaCont: row.fisaCont,
      contCorespondent: row.contCorespondent || undefined,
      debit: typeof debit === 'number' ? debit : 0,
      credit: typeof credit === 'number' ? credit : 0,
      valuta: typeof valuta === 'number' ? valuta : undefined,
      monedaValuta: typeof monedaValuta === 'string' ? monedaValuta : undefined
    });
  }

  return entries;
}
