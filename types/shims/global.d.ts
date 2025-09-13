// Global and external module shims for strict lib checking
// Make this file an external module to allow `declare global`
export {};

// Legacy Timer alias used by some libraries
declare global {
  // Compatible with Node and browser
  type Timer = ReturnType<typeof setTimeout>;
}

// Runtime-conditional DB engines referenced by types only
declare module 'bun:sqlite' {
  export class Database {
    constructor(...args: unknown[]);
  }
}

declare module 'node:sqlite' {
  export class DatabaseSync {
    constructor(...args: unknown[]);
  }
}
