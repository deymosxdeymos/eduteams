// Minimal stub for `better-call` to avoid strict lib issues from its generics
declare module 'better-call' {
  export type Endpoint = any;
  export type Middleware = any;
  export type EndpointContext<TPath = string, TContext = any> = any;
  export type InputContext<TPath = string, TContext = any> = any;
  export type CookieOptions = any;
  export type MiddlewareInputContext = any;
  export type MiddlewareOptions = any;

  // Minimal shape for schema generic referenced in types
  export interface StandardSchemaV1<TIn = unknown, TOut = unknown> {
    '~standard'?: { types?: { input?: TIn; output?: TOut } };
  }

  export class APIError extends Error {
    status?: number;
    constructor(message?: string, status?: number);
  }
}
