// Dev-only tool: on in `next dev`, off in production unless BRAINEE_LAB=1 (e2e sets it).
export function isLabEnabled(env: NodeJS.ProcessEnv = process.env) {
  return env.NODE_ENV !== "production" || env.BRAINEE_LAB === "1";
}
