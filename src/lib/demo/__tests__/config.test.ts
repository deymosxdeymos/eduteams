import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import {
  isDemoLoginEnabled,
  isDemoModeEnabled,
  isDemoUiEnabled,
} from '../config';

const originalDemoMode = process.env.DEMO_MODE;
const originalPublicDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE;

describe('demo config', () => {
  beforeEach(() => {
    delete process.env.DEMO_MODE;
    delete process.env.NEXT_PUBLIC_DEMO_MODE;
  });

  afterEach(() => {
    if (originalDemoMode === undefined) {
      delete process.env.DEMO_MODE;
    } else {
      process.env.DEMO_MODE = originalDemoMode;
    }

    if (originalPublicDemoMode === undefined) {
      delete process.env.NEXT_PUBLIC_DEMO_MODE;
    } else {
      process.env.NEXT_PUBLIC_DEMO_MODE = originalPublicDemoMode;
    }
  });

  it('treats demo mode as server-only', () => {
    process.env.NEXT_PUBLIC_DEMO_MODE = '1';

    expect(isDemoModeEnabled()).toBe(false);
  });

  it('enables demo mode when the server flag is set', () => {
    process.env.DEMO_MODE = '1';

    expect(isDemoModeEnabled()).toBe(true);
  });

  it('allows the UI flag to enable demo UI without enabling server behavior', () => {
    process.env.NEXT_PUBLIC_DEMO_MODE = '1';

    expect(isDemoUiEnabled()).toBe(true);
    expect(isDemoModeEnabled()).toBe(false);
  });

  it('keeps demo login disabled when only the public demo UI flag is set', () => {
    process.env.NEXT_PUBLIC_DEMO_MODE = '1';

    expect(isDemoLoginEnabled()).toBe(false);
  });
});
