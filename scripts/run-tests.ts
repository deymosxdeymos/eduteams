const env = { ...process.env };

async function run(cmd: string[], extraEnv?: Record<string, string>) {
  const proc = Bun.spawn({
    cmd,
    stdout: 'inherit',
    stderr: 'inherit',
    stdin: 'inherit',
    env: extraEnv ? { ...env, ...extraEnv } : env,
  });
  return await proc.exited;
}

const testExit = await run(['bun', 'test']);

if (testExit !== 0) {
  console.warn(`bun test exited with code ${testExit}; verifying results via JUnit report.`);
}

const verifyExit = await run(['bun', 'run', 'scripts/verify-tests.ts']);
if (verifyExit !== 0) {
  process.exit(verifyExit);
}

const coverageExit = await run(['bun', 'run', 'scripts/verify-coverage.ts']);
process.exit(coverageExit);
