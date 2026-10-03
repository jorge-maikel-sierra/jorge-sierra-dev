export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { registerLangfuse } = await import("./lib/observability/langfuse");
  registerLangfuse();
}
