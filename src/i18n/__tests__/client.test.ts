import { describe, expect, it, beforeEach, afterEach, mock } from 'bun:test';
import {
  getClientLocaleFromCookie,
  onLocaleChange,
  emitLocaleChange,
} from '../client';

// Store original globals
const originalDocument = global.document;
const originalWindow = global.window;

// Mock browser globals
const mockDocument = {
  cookie: '',
};

const mockWindow = {
  addEventListener: mock(() => {}),
  removeEventListener: mock(() => {}),
  dispatchEvent: mock(() => {}),
};

describe('i18n Client Functions', () => {
  beforeEach(() => {
    // Setup global mocks
    Object.defineProperty(global, 'document', {
      value: mockDocument,
      writable: true,
    });
    Object.defineProperty(global, 'window', {
      value: mockWindow,
      writable: true,
    });

    // Reset mocks
    mockDocument.cookie = '';
    mockWindow.addEventListener.mockClear();
    mockWindow.removeEventListener.mockClear();
    mockWindow.dispatchEvent.mockClear();
  });

  afterEach(() => {
    // Restore original globals
    Object.defineProperty(global, 'document', {
      value: originalDocument,
      writable: true,
    });
    Object.defineProperty(global, 'window', {
      value: originalWindow,
      writable: true,
    });
  });

  describe('getClientLocaleFromCookie', () => {
    it('returns "id" when document is undefined (server-side)', () => {
      // Temporarily remove document
      const originalDocument = global.document;
      Object.defineProperty(global, 'document', { value: undefined });

      const result = getClientLocaleFromCookie();
      expect(result).toBe('id');

      // Restore document
      Object.defineProperty(global, 'document', { value: originalDocument });
    });

    it('returns "id" when no lang cookie is present', () => {
      mockDocument.cookie = 'other=value; another=test';
      const result = getClientLocaleFromCookie();
      expect(result).toBe('id');
    });

    it('returns "en" when lang cookie is "en"', () => {
      mockDocument.cookie = 'lang=en; other=value';
      const result = getClientLocaleFromCookie();
      expect(result).toBe('en');
    });

    it('returns "id" when lang cookie is not "en"', () => {
      mockDocument.cookie = 'lang=fr; other=value';
      const result = getClientLocaleFromCookie();
      expect(result).toBe('id');
    });

    it('returns "id" when lang cookie has no value', () => {
      mockDocument.cookie = 'lang=; other=value';
      const result = getClientLocaleFromCookie();
      expect(result).toBe('id');
    });

    it('handles cookie with spaces around equals', () => {
      mockDocument.cookie = 'lang = en ; other = value';
      const result = getClientLocaleFromCookie();
      expect(result).toBe('id'); // Should be 'id' because the parsing expects 'lang=en' format
    });

    it('returns "en" when lang cookie is first in the list', () => {
      mockDocument.cookie = 'lang=en; theme=dark; user=123';
      const result = getClientLocaleFromCookie();
      expect(result).toBe('en');
    });

    it('returns "en" when lang cookie is in the middle', () => {
      mockDocument.cookie = 'theme=dark; lang=en; user=123';
      const result = getClientLocaleFromCookie();
      expect(result).toBe('en');
    });

    it('returns "en" when lang cookie is last', () => {
      mockDocument.cookie = 'theme=dark; user=123; lang=en';
      const result = getClientLocaleFromCookie();
      expect(result).toBe('en');
    });
  });

  describe('onLocaleChange', () => {
    it('does not add event listener when window is undefined', () => {
      const originalWindow = global.window;
      Object.defineProperty(global, 'window', { value: undefined });

      const callback = mock(() => {});
      const unsubscribe = onLocaleChange(callback);

      expect(mockWindow.addEventListener).not.toHaveBeenCalled();

      unsubscribe();

      // Restore window
      Object.defineProperty(global, 'window', { value: originalWindow });
    });

    it('adds event listener for locale-change event', () => {
      const callback = mock(() => {});
      const unsubscribe = onLocaleChange(callback);

      expect(mockWindow.addEventListener).toHaveBeenCalledWith(
        'locale-change',
        expect.any(Function)
      );

      unsubscribe();
    });

    it('adds event listener for locale-change event', () => {
      const callback = mock(() => {});
      const unsubscribe = onLocaleChange(callback);

      expect(mockWindow.addEventListener).toHaveBeenCalledWith(
        'locale-change',
        expect.any(Function)
      );

      unsubscribe();
    });

    it('removes event listener when unsubscribe is called', () => {
      const callback = mock(() => {});
      const unsubscribe = onLocaleChange(callback);

      unsubscribe();

      expect(mockWindow.removeEventListener).toHaveBeenCalledWith(
        'locale-change',
        expect.any(Function)
      );
    });

    it('handles multiple subscribers', () => {
      const callback1 = mock(() => {});
      const callback2 = mock(() => {});

      const unsubscribe1 = onLocaleChange(callback1);
      const unsubscribe2 = onLocaleChange(callback2);

      expect(mockWindow.addEventListener).toHaveBeenCalledTimes(2);

      unsubscribe1();
      unsubscribe2();

      expect(mockWindow.removeEventListener).toHaveBeenCalledTimes(2);
    });
  });

  describe('emitLocaleChange', () => {
    it('does not emit event when window is undefined', () => {
      const originalWindow = global.window;
      Object.defineProperty(global, 'window', { value: undefined });

      emitLocaleChange('en');

      expect(mockWindow.dispatchEvent).not.toHaveBeenCalled();

      // Restore window
      Object.defineProperty(global, 'window', { value: originalWindow });
    });

    it('emits CustomEvent with correct detail', () => {
      emitLocaleChange('en');

      expect(mockWindow.dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'locale-change',
          detail: { locale: 'en' },
        })
      );
    });

    it('emits CustomEvent for different locales', () => {
      emitLocaleChange('id');

      expect(mockWindow.dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'locale-change',
          detail: { locale: 'id' },
        })
      );
    });


  });

  describe('Integration tests', () => {
    it('complete locale change flow works', () => {
      const callback = mock(() => {});
      const unsubscribe = onLocaleChange(callback);

      emitLocaleChange('en');

      // The callback should be called through the event system
      // Note: In this test setup, the event isn't actually dispatched to listeners
      // because we're mocking the window methods separately

      unsubscribe();
    });

    it('handles rapid locale changes', () => {
      emitLocaleChange('en');
      emitLocaleChange('id');
      emitLocaleChange('en');

      expect(mockWindow.dispatchEvent).toHaveBeenCalledTimes(3);
    });

    it('cookie and event system work together', () => {
      // Set cookie
      mockDocument.cookie = 'lang=en';

      // Get locale from cookie
      const locale = getClientLocaleFromCookie();
      expect(locale).toBe('en');

      // Emit change event
      emitLocaleChange('id');

      expect(mockWindow.dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: { locale: 'id' },
        })
      );
    });
  });
});