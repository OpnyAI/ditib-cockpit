export type TxType = "INCOME" | "EXPENSE";

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
