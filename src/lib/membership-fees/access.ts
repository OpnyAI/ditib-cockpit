export type MembershipFeeRole = "ADMIN" | "VORSTAND" | "KASSIERER" | "MITARBEITER";

export function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

export function isDateLike(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function canWriteFees(role: MembershipFeeRole | null) {
  return role === "ADMIN" || role === "KASSIERER";
}

export function canReadAllFees(role: MembershipFeeRole | null) {
  return role === "ADMIN" || role === "KASSIERER";
}

export function canReadMemberFees(
  ctx: { role: MembershipFeeRole | null; userEmail: string | null },
  memberEmail: string | null,
) {
  if (canReadAllFees(ctx.role)) return true;
  if (!ctx.userEmail || !memberEmail) return false;
  return ctx.userEmail.trim().toLowerCase() === memberEmail.trim().toLowerCase();
}
