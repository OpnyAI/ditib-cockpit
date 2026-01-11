import type { FinanceTransaction } from "@/lib/finance/types";

const now = new Date().toISOString();

export const DEMO_TRANSACTIONS: FinanceTransaction[] = [
  {
    id: "demo-006db0ba-646e-4b5e-9915-7a672b986c4f",
    tenant_id: "DEMO_TENANT",
    account_id: "DEMO_ACCOUNT",
    category_id: "DEMO_CATEGORY_Miete",
    type: "EXPENSE",
    booking_date: "2026-01-06",
    amount_cents: 1234,
    counterparty: "Test-Lieferant 2",
    memo: "Audit-Test 2",
    reference: "BELEG-002",
    is_archived: false,
    archived_at: null,
    archived_by: null,
    created_by: "DEMO_USER",
    updated_by: null,
    created_at: now,
    updated_at: now,
  },
  {
    id: "demo-1ad8707a-2327-4742-a2ca-c716b4190092",
    tenant_id: "DEMO_TENANT",
    account_id: "DEMO_ACCOUNT",
    category_id: "DEMO_CATEGORY_Miete",
    type: "EXPENSE",
    booking_date: "2026-01-06",
    amount_cents: 1999,
    counterparty: "Test-Lieferant",
    memo: "Testbuchung",
    reference: "BELEG-001",
    is_archived: false,
    archived_at: null,
    archived_by: null,
    created_by: "DEMO_USER",
    updated_by: null,
    created_at: now,
    updated_at: now,
  },
];
