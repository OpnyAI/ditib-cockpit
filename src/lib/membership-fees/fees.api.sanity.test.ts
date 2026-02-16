import { describe, it } from "node:test";
import assert from "node:assert/strict";
// @ts-expect-error -- Node test runtime resolves .ts with --experimental-strip-types
import { canReadAllFees, canReadMemberFees, canWriteFees, isDateLike, isRecord } from "./access.ts";

describe("membership-fees api sanity", () => {
  it("enforces writer roles", () => {
    assert.equal(canWriteFees("ADMIN"), true);
    assert.equal(canWriteFees("KASSIERER"), true);
    assert.equal(canWriteFees("MITARBEITER"), false);
  });

  it("enforces reader scope", () => {
    assert.equal(canReadAllFees("ADMIN"), true);
    assert.equal(canReadAllFees("KASSIERER"), true);
    assert.equal(canReadAllFees("VORSTAND"), false);
  });

  it("checks own-fee access by email", () => {
    const ctx = {
      userEmail: "member@example.com",
      role: "MITARBEITER",
    } as const;
    assert.equal(canReadMemberFees(ctx, "member@example.com"), true);
    assert.equal(canReadMemberFees(ctx, "other@example.com"), false);
  });

  it("validates primitive helpers", () => {
    assert.equal(isRecord({ a: 1 }), true);
    assert.equal(isRecord(null), false);
    assert.equal(isDateLike("2026-02-16"), true);
    assert.equal(isDateLike("16.02.2026"), false);
  });
});
