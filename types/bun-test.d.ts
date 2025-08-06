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
    // @testing-library/jest-dom matchers
    toBeInTheDocument(): void;
    toBeVisible(): void;
    toBeEmptyDOMElement(): void;
    toBeInvalid(): void;
    toBeRequired(): void;
    toBeValid(): void;
    toContainElement(element: HTMLElement | null): void;
    toContainHTML(htmlText: string): void;
    toHaveAccessibleDescription(expectedAccessibleDescription?: string | RegExp): void;
    toHaveAccessibleName(expectedAccessibleName?: string | RegExp): void;
    toHaveAttribute(attributeName: string, expectedAttributeValue?: string): void;
    toHaveClass(...classNames: string[]): void;
    toHaveFocus(): void;
    toHaveFormValues(expectedValues: Record<string, any>): void;
    toHaveStyle(css: string | Record<string, any>): void;
    toHaveTextContent(text: string | RegExp | null): void;
    toHaveValue(value: string | string[] | number): void;
    toHaveDisplayValue(value: string | RegExp | (string | RegExp)[]): void;
    toBeChecked(): void;
    toBePartiallyChecked(): void;
    toHaveDescription(text?: string | RegExp): void;
    toHaveErrorMessage(text?: string | RegExp): void;
    toBeDisabled(): void;
    not: any;
    resolves: any;
    rejects: any;
    objectContaining(obj: any): any;
    assertions(count: number): void;
    any(constructor: any): any;
  };

  interface MockFunction {
    (...args: any[]): any;
    mockReset(): void;
    mockClear(): void;
    mockRestore?(): void;
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

  interface MockObject {
    (fn?: (...args: any[]) => any): MockFunction;
    module(moduleName: string, factory: () => any): void;
  }

  export const mock: MockObject;
}
