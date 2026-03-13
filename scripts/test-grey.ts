import { $ } from "bun";

// Ensure GREY flag is set for grey-box DB tests and enable AI-friendly output
await $`bun test src/lib/utils/__tests__/assignment-snapshot.test.ts`
  .env({ ...process.env, GREY: "1", AGENT: "1" })
  .cwd(process.cwd());
