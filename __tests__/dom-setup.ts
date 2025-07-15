import { Window } from 'happy-dom';

// Create a global window instance
const happyDomWindow = new Window();

// Set up minimal DOM globals for component testing
globalThis.window = happyDomWindow as any;
globalThis.document = happyDomWindow.document as any;
globalThis.navigator = happyDomWindow.navigator as any;
globalThis.location = happyDomWindow.location as any;

// Mock window.matchMedia for components that use it
Object.defineProperty(globalThis.window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});

// Mock window.ResizeObserver
Object.defineProperty(globalThis.window, 'ResizeObserver', {
  writable: true,
  value: class MockResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  },
});

// Mock window.IntersectionObserver
Object.defineProperty(globalThis.window, 'IntersectionObserver', {
  writable: true,
  value: class MockIntersectionObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  },
});

// Mock window.scrollTo
Object.defineProperty(globalThis.window, 'scrollTo', {
  writable: true,
  value: () => {},
});

// Mock getComputedStyle
Object.defineProperty(globalThis.window, 'getComputedStyle', {
  writable: true,
  value: () => ({
    getPropertyValue: () => '',
  }),
});

// Cleanup function
export const cleanupDOMSetup = () => {
  happyDomWindow.close();
};
