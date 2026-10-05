/**
 * Fired on window when the visitor sends their first question to the agent.
 * The hero releases its scroll pin: a long report must scroll like a page.
 */
export const AGENT_STARTED_EVENT = "jorge-sierra:agent-started";

/** The scene loads late (idle): a question may come before the pin exists. */
export const agentStarted = () => document.documentElement.dataset.agentStarted === "true";

export function announceAgentStarted() {
  document.documentElement.dataset.agentStarted = "true";
  window.dispatchEvent(new Event(AGENT_STARTED_EVENT));
}
