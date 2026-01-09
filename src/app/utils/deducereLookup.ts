interface TableRow {
  row: number;
  from: number;
  to: number;
  dependents0: number;
  dependents1: number;
  dependents2: number;
  dependents3: number;
  dependents4Plus: number;
}

// Generate the deduction lookup table data
export function generateDeducereTable(): TableRow[] {
  const rows: TableRow[] = [];
  const baseIncome = 1;
  const minWage = 4050;
  
  // Base percentages for each dependent category
  const basePercentages = {
    0: 20.0,
    1: 25.0,
    2: 30.0,
    3: 35.0,
    4: 45.0
  };
  
  // Generate rows 4-44 (41 rows total)
  for (let i = 0; i < 41; i++) {
    const rowNumber = i + 4;
    const from = i === 0 ? baseIncome : minWage + (i - 1) * 50 + 1;
    const to = minWage + i * 50;
    
    rows.push({
      row: rowNumber,
      from,
      to,
      dependents0: Math.max(0, basePercentages[0] - i * 0.5),
      dependents1: Math.max(0, basePercentages[1] - i * 0.5),
      dependents2: Math.max(0, basePercentages[2] - i * 0.5),
      dependents3: Math.max(0, basePercentages[3] - i * 0.5),
      dependents4Plus: Math.max(0, basePercentages[4] - i * 0.5)
    });
  }
  
  return rows;
}

// Look up the deduction percentage based on income and number of dependents
export function lookupDeducerePercentage(income: number, numDependents: number): number | null {
  const table = generateDeducereTable();
  
  // Find the row where income falls within the range
  const row = table.find(r => income >= r.from && income <= r.to);
  
  if (!row) {
    // If income is outside the table range, return null
    return null;
  }
  
  // Get the percentage based on number of dependents
  let percentage: number;
  if (numDependents === 0) {
    percentage = row.dependents0;
  } else if (numDependents === 1) {
    percentage = row.dependents1;
  } else if (numDependents === 2) {
    percentage = row.dependents2;
  } else if (numDependents === 3) {
    percentage = row.dependents3;
  } else {
    // 4 or more dependents
    percentage = row.dependents4Plus;
  }
  
  return percentage > 0 ? percentage : null;
}

