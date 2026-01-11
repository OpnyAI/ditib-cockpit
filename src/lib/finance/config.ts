export type FinanceMode = "DEMO" | "PRODUCTIVE";

export function getFinanceMode(): FinanceMode {
  const mode = process.env.FINANCE_MODE;

  if (mode === "DEMO" || mode === "PRODUCTIVE") return mode;

  // Safety default
  return "PRODUCTIVE";
}
