// src/components/finance/finance.types.ts

export type TxType = "INCOME" | "EXPENSE";

export type Account = {
  id: string;
  name: string;
};

export type Category = {
  id: string;
  name: string;
  type: TxType;
};

export type Transaction = {
  id: string;

  booking_date: string; // YYYY-MM-DD
  type: TxType;
  amount_cents: number;

  account_id: string;
  category_id: string | null;

  counterparty: string | null;
  memo: string | null;
  reference: string | null;

  is_archived: boolean;

  created_at?: string;
  updated_at?: string;
};

export type HintTone = "neutral" | "warn" | "info";

export type UiHint = {
  id: string;
  title: string;
  body: string;
  tone: HintTone;
};
