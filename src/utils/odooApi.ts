const API_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/odoo-rpc`;
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export interface OdooRpcParams {
  uid: number;
  password: string;
  model: string;
  method: string;
  args?: any[];
  kwargs?: Record<string, any>;
}

export const odooRpcCall = async (params: OdooRpcParams): Promise<any> => {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    const data = await response.json();
    return data.result || [];
  } catch (error) {
    console.error('RPC call error:', error);
    throw error;
  }
};

export const computeTotalForAccounts = async (
  accountIds: number[],
  dateRange: [string, string],
  calcType: string,
  uid: number,
  password: string
): Promise<number> => {
  if (!accountIds.length) return 0;

  const domain = [
    ['account_id', 'in', accountIds],
    ['date', '>=', dateRange[0]],
    ['date', '<=', dateRange[1]],
    ['parent_state', '=', 'posted'],
  ];

  const groups = await odooRpcCall({
    uid,
    password,
    model: 'account.move.line',
    method: 'read_group',
    args: [domain, ['account_id', 'debit', 'credit'], ['account_id']],
    kwargs: { lazy: false },
  });

  let total = 0;
  for (const g of groups) {
    const debit = g.debit || 0;
    const credit = g.credit || 0;

    if (calcType === 'asset') {
      total += debit - credit;
    } else if (['liability', 'equity', 'income', 'other_income'].includes(calcType)) {
      total += credit - debit;
    } else {
      total += debit - credit;
    }
  }
  return total;
};

export const fetchSalespersons = async (uid: number, password: string) => {
  const users = await odooRpcCall({
    uid,
    password,
    model: 'res.users',
    method: 'search_read',
    args: [[['share', '=', false]]],
    kwargs: { fields: ['id', 'name'], limit: 500 },
  });
  return users.map((u: any) => ({ id: u.id, name: u.name }));
};

export const fetchSalesTeams = async (uid: number, password: string) => {
  const teams = await odooRpcCall({
    uid,
    password,
    model: 'crm.team',
    method: 'search_read',
    args: [[]],
    kwargs: { fields: ['id', 'name'], limit: 200 },
  });
  return teams.map((t: any) => ({ id: t.id, name: t.name }));
};

export interface PnLData {
  year: number;
  total_income: number;
  total_cogs: number;
  gross_profit: number;
  total_expense: number;
  total_depreciation: number;
  operating_income: number;
  net_income: number;
}

export const getProfitAndLoss = async (
  year: number,
  uid: number,
  password: string
): Promise<PnLData> => {
  const startDate = `${year}-01-01`;
  const endDate = `${year}-12-31`;
  const dateRange: [string, string] = [startDate, endDate];

  const incomeAccounts = await odooRpcCall({
    uid,
    password,
    model: 'account.account',
    method: 'search_read',
    args: [[['account_type', 'in', ['income', 'income_other']]]],
    kwargs: { fields: ['id'] },
  });

  const cogsAccounts = await odooRpcCall({
    uid,
    password,
    model: 'account.account',
    method: 'search_read',
    args: [[['account_type', '=', 'expense_direct_cost']]],
    kwargs: { fields: ['id'] },
  });

  const expenseAccounts = await odooRpcCall({
    uid,
    password,
    model: 'account.account',
    method: 'search_read',
    args: [[['account_type', '=', 'expense']]],
    kwargs: { fields: ['id'] },
  });

  const depreciationAccounts = await odooRpcCall({
    uid,
    password,
    model: 'account.account',
    method: 'search_read',
    args: [[['account_type', '=', 'expense_depreciation']]],
    kwargs: { fields: ['id'] },
  });

  const totalIncome = await computeTotalForAccounts(
    incomeAccounts.map((a: any) => a.id),
    dateRange,
    'income',
    uid,
    password
  );

  const totalCogs = await computeTotalForAccounts(
    cogsAccounts.map((a: any) => a.id),
    dateRange,
    'expense',
    uid,
    password
  );

  const totalExpense = await computeTotalForAccounts(
    expenseAccounts.map((a: any) => a.id),
    dateRange,
    'expense',
    uid,
    password
  );

  const totalDepreciation = await computeTotalForAccounts(
    depreciationAccounts.map((a: any) => a.id),
    dateRange,
    'expense',
    uid,
    password
  );

  const grossProfit = totalIncome - totalCogs;
  const operatingIncome = grossProfit - totalExpense;
  const netIncome = operatingIncome - totalDepreciation;

  return {
    year,
    total_income: totalIncome,
    total_cogs: totalCogs,
    gross_profit: grossProfit,
    total_expense: totalExpense,
    total_depreciation: totalDepreciation,
    operating_income: operatingIncome,
    net_income: netIncome,
  };
};

export interface BalanceSheetData {
  date: string;
  total_assets: number;
  total_liabilities: number;
  total_equity: number;
  balance_difference: number;
}

export const getBalanceSheet = async (
  selectedDate: string,
  uid: number,
  password: string
): Promise<BalanceSheetData> => {
  const startDate = '2000-01-01';
  const endDate = selectedDate;
  const dateRange: [string, string] = [startDate, endDate];

  const assetTypes = [
    'asset_current',
    'asset_non_current',
    'asset_cash',
    'asset_receivable',
    'asset_prepayments',
    'asset_fixed',
  ];
  const liabilityTypes = [
    'liability_current',
    'liability_non_current',
    'liability_payable',
    'liability_credit_card',
  ];
  const equityTypes = [
    'equity',
    'equity_unaffected',
    'equity_current_earnings',
    'income',
    'income_other',
    'expense',
    'expense_direct_cost',
  ];

  const assetAccounts = await odooRpcCall({
    uid,
    password,
    model: 'account.account',
    method: 'search_read',
    args: [[['account_type', 'in', assetTypes]]],
    kwargs: { fields: ['id'] },
  });

  const liabilityAccounts = await odooRpcCall({
    uid,
    password,
    model: 'account.account',
    method: 'search_read',
    args: [[['account_type', 'in', liabilityTypes]]],
    kwargs: { fields: ['id'] },
  });

  const equityAccounts = await odooRpcCall({
    uid,
    password,
    model: 'account.account',
    method: 'search_read',
    args: [[['account_type', 'in', equityTypes]]],
    kwargs: { fields: ['id'] },
  });

  const totalAssets = await computeTotalForAccounts(
    assetAccounts.map((a: any) => a.id),
    dateRange,
    'asset',
    uid,
    password
  );

  const totalLiabilities = await computeTotalForAccounts(
    liabilityAccounts.map((a: any) => a.id),
    dateRange,
    'liability',
    uid,
    password
  );

  const totalEquity = await computeTotalForAccounts(
    equityAccounts.map((a: any) => a.id),
    dateRange,
    'equity',
    uid,
    password
  );

  const balanceDifference = totalAssets - (totalLiabilities + totalEquity);

  return {
    date: selectedDate,
    total_assets: totalAssets,
    total_liabilities: totalLiabilities,
    total_equity: totalEquity,
    balance_difference: balanceDifference,
  };
};
