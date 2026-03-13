const DEFAULT_DATABASE_URL = "postgresql://user:password@localhost:5432/eduteams";

function collectRequestedTargets() {
  return Bun.argv.slice(2).filter((value) => value.length > 0);
}

async function discoverTestFiles() {
  const proc = Bun.spawn(
    ["rg", "--files", "-g", "*test.ts", "-g", "*test.tsx", "-g", "*spec.ts", "-g", "*spec.tsx"],
    {
      cwd: process.cwd(),
      stdout: "pipe",
      stderr: "inherit",
      env: process.env,
    },
  );

  const output = await new Response(proc.stdout).text();
  const exitCode = await proc.exited;
  if (exitCode !== 0) {
    throw new Error("Failed to discover test files with rg.");
  }

  return output
    .split("\n")
    .map((value) => value.trim())
    .filter((value) => value.length > 0)
    .sort((left, right) => left.localeCompare(right));
}

async function runTestTarget(target: string) {
  console.log(`\n==> ${target}`);

  const proc = Bun.spawn(["bun", "test", target], {
    cwd: process.cwd(),
    stdout: "inherit",
    stderr: "inherit",
    stdin: "inherit",
    env: process.env,
  });

  return proc.exited;
}

async function main() {
  process.env.DATABASE_URL ??= DEFAULT_DATABASE_URL;

  const requestedTargets = collectRequestedTargets();
  const testTargets = requestedTargets.length > 0 ? requestedTargets : await discoverTestFiles();

  if (testTargets.length === 0) {
    console.log("No test files found.");
    return;
  }

  const failures: string[] = [];

  for (const target of testTargets) {
    const exitCode = await runTestTarget(target);
    if (exitCode !== 0) {
      failures.push(target);
    }
  }

  if (failures.length === 0) {
    console.log(`\nAll ${testTargets.length} test target(s) passed.`);
    return;
  }

  console.error(`\n${failures.length} test target(s) failed:`);
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exitCode = 1;
}

await main();
