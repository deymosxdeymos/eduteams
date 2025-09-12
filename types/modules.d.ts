// Module type declarations for external packages

declare module 'node-cache' {
  interface NodeCacheOptions {
    stdTTL?: number;
    checkperiod?: number;
    maxKeys?: number;
    useClones?: boolean;
  }

  export default class NodeCache {
    constructor(options?: NodeCacheOptions);

    get<T = unknown>(key: string): T | undefined;
    set<T = unknown>(key: string, value: T, ttl?: number): boolean;
    del(key: string): number;
    flushAll(): void;
    close(): void;
  }
}

declare module 'crypto' {
  export function randomUUID(): string;
}
