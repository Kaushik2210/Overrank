// Starts the dev server in preview mode (in-memory data, no Supabase), whatever .env.local says.
// Useful on networks that cannot reach *.supabase.co. Honours PORT, defaults to 3100.
import { spawn } from "node:child_process";

const port = process.env.PORT ?? "3100";
const child = spawn(process.execPath, ["node_modules/next/dist/bin/next", "dev", "-p", port], {
  stdio: "inherit",
  env: { ...process.env, NEXT_PUBLIC_SUPABASE_URL: "", NEXT_PUBLIC_SUPABASE_ANON_KEY: "", SUPABASE_SERVICE_ROLE_KEY: "" },
});
child.on("exit", (code) => process.exit(code ?? 0));
