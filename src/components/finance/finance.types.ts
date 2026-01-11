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
  booking_date: string;
  type: TxType;
  amount_cents: number;
  account_id: string;
  category_id: string | null; // ✅ Backend erlaubt null
  counterparty: string | null;
  memo: string | null;
  reference: string | null;

  is_archived: boolean; // ✅ nicht optional, weil Backend immer liefert (und UI darauf baut)
  created_at?: string; // UI braucht das nicht zwingend, optional ok
};

export type HintTone = "neutral" | "warn" | "info";

export type UiHint = {
  id: string;
  title: string;
  body: string;
  tone: HintTone;
};
