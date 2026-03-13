import { readdir } from "node:fs/promises";
import { join } from "node:path";

const DEFAULT_DATABASE_URL = "postgresql://user:password@localhost:5432/eduteams";
const TEST_FILE_PATTERN = /\.(test|spec)\.tsx?$/;
const SKIPPED_DIRECTORIES = new Set([".git", ".next", "coverage", "node_modules"]);

function collectForwardedArgs() {
  return Bun.argv.slice(2).filter((value) => value.length > 0);
}

async function discoverTestFiles() {
  try {
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
  } catch (error) {
    if (
      !(error instanceof Error) ||
      !error.message.includes('Executable not found in $PATH: "rg"')
    ) {
      throw error;
    }
  }

  return discoverTestFilesWithoutRg();
}

async function discoverTestFilesWithoutRg(
  root = process.cwd(),
  currentDir = root,
): Promise<string[]> {
  const entries = await readdir(currentDir, { withFileTypes: true });
  const discovered: string[] = [];

  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (SKIPPED_DIRECTORIES.has(entry.name)) {
        continue;
      }

      discovered.push(...(await discoverTestFilesWithoutRg(root, join(currentDir, entry.name))));
      continue;
    }

    if (!entry.isFile() || !TEST_FILE_PATTERN.test(entry.name)) {
      continue;
    }

    const fullPath = join(currentDir, entry.name);
    discovered.push(fullPath.slice(root.length + 1));
  }

  return discovered.sort((left, right) => left.localeCompare(right));
}

async function runBunTest(args: string[], label?: string) {
  if (label) {
    console.log(`\n==> ${label}`);
  }

  const proc = Bun.spawn(["bun", "test", ...args], {
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

  const forwardedArgs = collectForwardedArgs();
  if (forwardedArgs.length > 0) {
    const exitCode = await runBunTest(forwardedArgs);
    process.exitCode = exitCode;
    return;
  }

  const testTargets = await discoverTestFiles();

  if (testTargets.length === 0) {
    console.log("No test files found.");
    return;
  }

  const failures: string[] = [];

  for (const target of testTargets) {
    const exitCode = await runBunTest([target], target);
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
