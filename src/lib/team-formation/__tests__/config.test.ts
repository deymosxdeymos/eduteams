import { afterEach, describe, expect, it } from 'bun:test';
import {
  assertEdu2comProviderConfiguration,
  getRequiredEdu2comWebhookBaseUrl,
  resolveTeamFormationProvider,
} from '../config';

const originalNodeEnv = process.env.NODE_ENV;
const originalDemoMode = process.env.DEMO_MODE;
const originalProvider = process.env.TEAM_FORMATION_PROVIDER;
const originalWebhookSecret = process.env.EDU2COM_WEBHOOK_SECRET;
const originalWebhookBaseUrl = process.env.EDU2COM_WEBHOOK_BASE_URL;

afterEach(() => {
  process.env.NODE_ENV = originalNodeEnv;
  if (originalDemoMode === undefined) delete process.env.DEMO_MODE;
  else process.env.DEMO_MODE = originalDemoMode;
  if (originalProvider === undefined)
    delete process.env.TEAM_FORMATION_PROVIDER;
  else process.env.TEAM_FORMATION_PROVIDER = originalProvider;
  if (originalWebhookSecret === undefined)
    delete process.env.EDU2COM_WEBHOOK_SECRET;
  else process.env.EDU2COM_WEBHOOK_SECRET = originalWebhookSecret;
  if (originalWebhookBaseUrl === undefined)
    delete process.env.EDU2COM_WEBHOOK_BASE_URL;
  else process.env.EDU2COM_WEBHOOK_BASE_URL = originalWebhookBaseUrl;
});

describe('team formation config', () => {
  it('defaults demo mode to local', () => {
    process.env.DEMO_MODE = '1';
    process.env.NODE_ENV = 'production';
    delete process.env.TEAM_FORMATION_PROVIDER;

    expect(resolveTeamFormationProvider()).toBe('local');
  });

  it('defaults development to local', () => {
    delete process.env.DEMO_MODE;
    process.env.NODE_ENV = 'development';
    delete process.env.TEAM_FORMATION_PROVIDER;

    expect(resolveTeamFormationProvider()).toBe('local');
  });

  it('defaults non-demo production to edu2com', () => {
    delete process.env.DEMO_MODE;
    process.env.NODE_ENV = 'production';
    delete process.env.TEAM_FORMATION_PROVIDER;

    expect(resolveTeamFormationProvider()).toBe('edu2com');
  });

  it('prefers explicit provider overrides', () => {
    process.env.NODE_ENV = 'production';
    process.env.TEAM_FORMATION_PROVIDER = 'local';

    expect(resolveTeamFormationProvider()).toBe('local');
  });

  it('fails edu2com validation without a webhook secret', () => {
    process.env.NODE_ENV = 'production';
    process.env.EDU2COM_WEBHOOK_BASE_URL = 'https://example.com';
    delete process.env.EDU2COM_WEBHOOK_SECRET;

    expect(() => assertEdu2comProviderConfiguration()).toThrow(
      'EDU2COM_WEBHOOK_SECRET'
    );
  });

  it('fails edu2com validation without a public base URL', () => {
    process.env.NODE_ENV = 'production';
    process.env.EDU2COM_WEBHOOK_SECRET = 'secret';
    process.env.EDU2COM_WEBHOOK_BASE_URL = 'http://localhost:3000';

    expect(() => getRequiredEdu2comWebhookBaseUrl()).toThrow('https://');
  });
});
