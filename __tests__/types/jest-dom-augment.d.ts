// Type-only augmentation for Bun's Matchers to include @testing-library/jest-dom matchers
// Scoped to tests via file location and tsconfig.test.json includes

declare module 'bun:test' {
  interface Matchers<T = unknown> {
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
  }
}
