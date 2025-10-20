import { describe, expect, it } from 'bun:test';
import {
  AuthError,
  AuthorizationError,
  HttpError,
  NotFoundError,
  ValidationError,
} from '../errors';

describe('HttpError', () => {
  it('creates error with status, message, and code', () => {
    const error = new HttpError(500, 'Internal server error', 'INTERNAL_ERROR');

    expect(error.status).toBe(500);
    expect(error.message).toBe('Internal server error');
    expect(error.code).toBe('INTERNAL_ERROR');
    expect(error.name).toBe('HttpError');
    expect(error instanceof Error).toBe(true);
  });

  it('creates error without code', () => {
    const error = new HttpError(404, 'Not found');

    expect(error.status).toBe(404);
    expect(error.message).toBe('Not found');
    expect(error.code).toBeUndefined();
    expect(error.name).toBe('HttpError');
  });
});

describe('AuthError', () => {
  it('creates auth error with default message', () => {
    const error = new AuthError();

    expect(error.status).toBe(401);
    expect(error.message).toBe('Authentication required');
    expect(error.code).toBe('AUTH_ERROR');
    expect(error.name).toBe('HttpError');
    expect(error instanceof HttpError).toBe(true);
  });

  it('creates auth error with custom message', () => {
    const error = new AuthError('Custom auth message');

    expect(error.status).toBe(401);
    expect(error.message).toBe('Custom auth message');
    expect(error.code).toBe('AUTH_ERROR');
  });
});

describe('AuthorizationError', () => {
  it('creates authorization error with default message', () => {
    const error = new AuthorizationError();

    expect(error.status).toBe(403);
    expect(error.message).toBe('Insufficient permissions');
    expect(error.code).toBe('AUTHORIZATION_ERROR');
    expect(error.name).toBe('HttpError');
    expect(error instanceof HttpError).toBe(true);
  });

  it('creates authorization error with custom message', () => {
    const error = new AuthorizationError('Custom authz message');

    expect(error.status).toBe(403);
    expect(error.message).toBe('Custom authz message');
    expect(error.code).toBe('AUTHORIZATION_ERROR');
  });
});

describe('NotFoundError', () => {
  it('creates not found error with default message', () => {
    const error = new NotFoundError();

    expect(error.status).toBe(404);
    expect(error.message).toBe('Resource not found');
    expect(error.code).toBe('NOT_FOUND');
    expect(error.name).toBe('HttpError');
    expect(error instanceof HttpError).toBe(true);
  });

  it('creates not found error with custom message', () => {
    const error = new NotFoundError('Custom not found message');

    expect(error.status).toBe(404);
    expect(error.message).toBe('Custom not found message');
    expect(error.code).toBe('NOT_FOUND');
  });
});

describe('ValidationError', () => {
  it('creates validation error with default message', () => {
    const error = new ValidationError();

    expect(error.status).toBe(400);
    expect(error.message).toBe('Validation failed');
    expect(error.code).toBe('VALIDATION_ERROR');
    expect(error.name).toBe('HttpError');
    expect(error instanceof HttpError).toBe(true);
  });

  it('creates validation error with custom message', () => {
    const error = new ValidationError('Custom validation message');

    expect(error.status).toBe(400);
    expect(error.message).toBe('Custom validation message');
    expect(error.code).toBe('VALIDATION_ERROR');
  });
});
