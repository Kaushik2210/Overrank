export async function register() {
  // Node-only code lives in its own file so the Edge build never analyses it.
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { registerDohResolver } = await import("./instrumentation-node");
    await registerDohResolver();
  }
}
