// src/lib/finance/types.ts

export type TxType = "INCOME" | "EXPENSE";

export type FinanceAccount = {
  id: string;
  tenant_id: string;
  name: string;
  created_at: string;
  updated_at: string;
};

export type FinanceCategory = {
  id: string;
  tenant_id: string;
  name: string;
  type: TxType;
  created_at: string;
  updated_at: string;
};

export type FinanceTransaction = {
  id: string;
  tenant_id: string;
  account_id: string;
  category_id: string | null;

  type: TxType;
  booking_date: string; // YYYY-MM-DD
  amount_cents: number;

  counterparty: string | null;
  memo: string | null;
  reference: string | null;

  is_archived: boolean;
  archived_at: string | null;
  archived_by: string | null;

  created_by: string | null;
  updated_by: string | null;

  created_at: string;
  updated_at: string;
};

// API response shapes (optional, aber hilfreich als Contract)
export type FinanceTransactionsListResponse = {
  transactions: FinanceTransaction[];
  limit: number;
  offset: number;
};

export type FinanceTransactionCreateResponse = {
  transaction: FinanceTransaction;
};
