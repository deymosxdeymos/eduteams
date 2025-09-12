// Global type definitions for Node.js environment
declare global {
  namespace NodeJS {
    interface Timeout {
      ref(): this;
      unref(): this;
    }
  }

  type Timeout = NodeJS.Timeout;

  var process: {
    env: Record<string, string | undefined>;
    exit(code?: number): never;
    on(event: string, listener: (...args: any[]) => void): void;
    memoryUsage(): {
      heapUsed: number;
      heapTotal: number;
      external: number;
      rss: number;
    };
  };

  var setImmediate: (callback: (...args: any[]) => void, ...args: any[]) => NodeJS.Timeout;
  var require: (id: string) => any;
  var module: {
    exports: any;
  };
}

export {};