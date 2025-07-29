// Global type definitions for Bun test
declare module 'bun:test' {
  export function describe(name: string, fn: () => void): void;
  export function it(name: string, fn: () => void | Promise<void>): void;
  export function test(name: string, fn: () => void | Promise<void>): void;
  export function beforeEach(fn: () => void | Promise<void>): void;
  export function afterEach(fn: () => void | Promise<void>): void;
  export function expect(actual: any): {
    toBe(expected: any): void;
    toEqual(expected: any): void;
    toBeNull(): void;
    toBeUndefined(): void;
    toBeTruthy(): void;
    toBeFalsy(): void;
    toThrow(expected?: string | Error): void;
    toHaveBeenCalled(): void;
    toHaveBeenCalledWith(...args: any[]): void;
    toHaveBeenCalledTimes(count: number): void;
    toHaveProperty(property: string): void;
    toHaveLength(length: number): void;
    toBeGreaterThan(expected: number): void;
    toBeLessThan(expected: number): void;
    toBeGreaterThanOrEqual(expected: number): void;
    toBeLessThanOrEqual(expected: number): void;
    toBeInstanceOf(expected: any): void;
    toBeDefined(): void;
    toBeNaN(): void;
    toMatch(expected: string | RegExp): void;
    toContain(item: any): void;
    toContainEqual(item: any): void;
    toHaveLength(length: number): void;
    toHaveProperty(property: string, value?: any): void;
    not: any;
    resolves: any;
    rejects: any;
    objectContaining(obj: any): any;
  };
  export function mock(fn?: (...args: any[]) => any): MockFunction;

  interface MockFunction {
    (...args: any[]): any;
    mockReset(): void;
    mockClear(): void;
    mockResolvedValue(value: any): void;
    mockResolvedValueOnce(value: any): void;
    mockRejectedValue(error: any): void;
    mockRejectedValueOnce(error: any): void;
    mockReturnValue(value: any): void;
    mockImplementation(fn: (...args: any[]) => any): void;
    mock: {
      calls: any[][];
    };
  }

  const mockModule: {
    module(moduleName: string, factory: () => any): void;
  };

  export { mockModule as mock };
}
