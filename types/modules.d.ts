// Module type declarations for external packages

declare module '@upstash/redis' {
  export class Redis {
    constructor(config: {
      url: string;
      token: string;
    });
    
    ping(): Promise<string>;
    get<T = any>(key: string): Promise<T | null>;
    set<T = any>(key: string, value: T, options?: { ex?: number }): Promise<string>;
    del(...keys: string[]): Promise<number>;
    keys(pattern: string): Promise<string[]>;
  }
}

declare module 'node-cache' {
  interface NodeCacheOptions {
    stdTTL?: number;
    checkperiod?: number;
    maxKeys?: number;
    useClones?: boolean;
  }

  export default class NodeCache {
    constructor(options?: NodeCacheOptions);
    
    get<T = any>(key: string): T | undefined;
    set<T = any>(key: string, value: T, ttl?: number): boolean;
    del(key: string): number;
    flushAll(): void;
    close(): void;
  }
}

declare module 'crypto' {
  export function randomUUID(): string;
}