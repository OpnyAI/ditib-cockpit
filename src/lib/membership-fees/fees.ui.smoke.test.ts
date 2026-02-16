import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { MembershipFeeInvoice } from "./types.ts";
// @ts-expect-error -- Node test runtime resolves .ts with --experimental-strip-types
import { deriveMembershipFeeSummary } from "./status.ts";

describe("membership-fees ui smoke", () => {
  it("returns ALL_PAID when no open invoices exist", () => {
    const invoices: MembershipFeeInvoice[] = [
      {
        id: "1",
        member_id: "m1",
        rule_id: null,
        due_date: "2026-01-10",
        amount_cents: 2000,
        status: "PAID",
        generated_at: "2026-01-01T00:00:00.000Z",
        paid_at: "2026-01-05T00:00:00.000Z",
      },
    ];

    const summary = deriveMembershipFeeSummary(invoices, "2026-02-16");
    assert.equal(summary.status, "ALL_PAID");
    assert.equal(summary.openAmountCents, 0);
  });

  it("returns PARTIAL_OPEN when open exists but not overdue", () => {
    const invoices: MembershipFeeInvoice[] = [
      {
        id: "1",
        member_id: "m1",
        rule_id: null,
        due_date: "2026-12-10",
        amount_cents: 3500,
        status: "OPEN",
        generated_at: "2026-01-01T00:00:00.000Z",
        paid_at: null,
      },
    ];

    const summary = deriveMembershipFeeSummary(invoices, "2026-02-16");
    assert.equal(summary.status, "PARTIAL_OPEN");
    assert.equal(summary.openAmountCents, 3500);
  });

  it("returns OVERDUE_OPEN when due date is in past", () => {
    const invoices: MembershipFeeInvoice[] = [
      {
        id: "1",
        member_id: "m1",
        rule_id: null,
        due_date: "2025-12-10",
        amount_cents: 3500,
        status: "OPEN",
        generated_at: "2025-01-01T00:00:00.000Z",
        paid_at: null,
      },
    ];

    const summary = deriveMembershipFeeSummary(invoices, "2026-02-16");
    assert.equal(summary.status, "OVERDUE_OPEN");
    assert.equal(summary.openCount, 1);
  });
});
