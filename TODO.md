# TODO

## Test Fixes Needed

### 🔴 3 Remaining Failing Tests

1. **Race condition test** (`__tests__/onboarding/resume.test.ts:390`)
   - Issue: Mock isolation problem - expects 3 calls but gets 12
   - Fix: Improve mock cleanup between test runs
   - Priority: Low

2. **Authentication test** (`__tests__/api/onboarding-status.test.ts:38`)
   - Issue: Expects `redirectUrl` but gets `undefined` for unauthenticated users
   - Fix: Update test expectation or API logic for unauthenticated users
   - Priority: Medium

3. **Missing role test** (`__tests__/api/onboarding-status.test.ts:56`)
   - Issue: Wrong test expectation - expects `/onboarding/kepribadian` but gets `/onboarding/role`
   - Fix: Update test to expect correct redirect URL for null role + data-diri step
   - Priority: Low

### ✅ Recently Completed

- ✅ Fixed onboarding completion detection in status endpoint
- ✅ Handled null role edge cases in onboarding logic
- ✅ Fixed integration test expectations
- ✅ Added proper bun test configuration with coverage
- ✅ Aligned bun test setup with AGENTS.md requirements

### 📊 Current Test Status

- **86 passing tests** (excellent coverage)
- **1 skipped test** (rate limiting - future feature)
- **3 failing tests** (minor issues, not blocking)
- **77.74% line coverage**

In the meantime, don't forget to drink your coffee.
