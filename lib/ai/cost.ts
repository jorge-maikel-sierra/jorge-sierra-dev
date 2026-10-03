// docs/agent-spec.md §9: estimated cost per answer, summed into a daily
// counter; above AGENT_DAILY_BUDGET_USD the agent rests until tomorrow (UTC).

/** USD per token, from the AI Gateway / provider catalogs (task 4.5). */
export const PRICES: Record<string, { input: number; output: number }> = {
  "claude-sonnet-5-5": { input: 2e-6, output: 10e-6 },
  "claude-sonnet-5": { input: 2e-6, output: 10e-6 },
  "claude-haiku-4-5": { input: 1e-6, output: 5e-6 },
  "text-embedding-3-small": { input: 0.02e-6, output: 0 },
};

/** Unknown models are priced like the most expensive known chat model. */
const FALLBACK = { input: 2e-6, output: 10e-6 };

export type Usage = { model: string; inputTokens: number; outputTokens: number };

export function estimateCost(usages: Usage[]): number {
  return usages.reduce((total, usage) => {
    const price = PRICES[usage.model] ?? FALLBACK;
    return total + usage.inputTokens * price.input + usage.outputTokens * price.output;
  }, 0);
}

export type BudgetStore = {
  get(key: string): Promise<number>;
  add(key: string, amount: number): Promise<number>;
};

export const budgetKey = (now: Date) => `agent:cost:${now.toISOString().slice(0, 10)}`;

export function createBudget(store: BudgetStore, dailyLimitUsd: number, now = () => new Date()) {
  return {
    async exhausted() {
      return (await store.get(budgetKey(now()))) >= dailyLimitUsd;
    },
    async spend(amountUsd: number) {
      if (amountUsd > 0) await store.add(budgetKey(now()), amountUsd);
    },
  };
}
