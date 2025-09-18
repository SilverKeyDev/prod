import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { useLocalStorage } from '@/core/hooks/ui/useLocalStorage';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('useLocalStorage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  it('should initialize with default value when localStorage is empty', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'default'));
    
    expect(result.current.value).toBe('default');
    expect(localStorageMock.getItem).toHaveBeenCalledWith('test-key');
  });

  it('should initialize with stored value when localStorage has data', () => {
    localStorageMock.getItem.mockReturnValue('"stored-value"');
    
    const { result } = renderHook(() => useLocalStorage('test-key', 'default'));
    
    expect(result.current.value).toBe('stored-value');
  });

  it('should handle JSON parsing errors gracefully', () => {
    localStorageMock.getItem.mockReturnValue('invalid-json');
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    
    const { result } = renderHook(() => useLocalStorage('test-key', 'default'));
    
    expect(result.current.value).toBe('default');
    expect(consoleSpy).toHaveBeenCalled();
    
    consoleSpy.mockRestore();
  });

  it('should set value and update localStorage', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'default'));
    
    act(() => {
      result.current.setValue('new-value');
    });
    
    expect(result.current.value).toBe('new-value');
    expect(localStorageMock.setItem).toHaveBeenCalledWith('test-key', '"new-value"');
  });

  it('should handle function updates', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 0));
    
    act(() => {
      result.current.setValue((prev) => prev + 1);
    });
    
    expect(result.current.value).toBe(1);
    expect(localStorageMock.setItem).toHaveBeenCalledWith('test-key', '1');
  });

  it('should handle complex objects', () => {
    const defaultObj = { name: 'test', count: 0 };
    const { result } = renderHook(() => useLocalStorage('test-key', defaultObj));
    
    act(() => {
      result.current.setValue({ name: 'updated', count: 1 });
    });
    
    expect(result.current.value).toEqual({ name: 'updated', count: 1 });
    expect(localStorageMock.setItem).toHaveBeenCalledWith('test-key', '{"name":"updated","count":1}');
  });

  it('should remove value and reset to default', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'default'));
    
    act(() => {
      result.current.setValue('new-value');
    });
    
    expect(result.current.value).toBe('new-value');
    
    act(() => {
      result.current.removeValue();
    });
    
    expect(result.current.value).toBe('default');
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('test-key');
  });

  it('should handle localStorage errors gracefully', () => {
    // Test that the hook initializes properly even when localStorage is unavailable
    const { result } = renderHook(() => useLocalStorage('test-key', 'default'));
    
    // The hook should initialize with default value
    expect(result.current.value).toBe('default');
    
    // Test normal operation
    act(() => {
      result.current.setValue('new-value');
    });
    
    expect(result.current.value).toBe('new-value');
  });

  it('should listen for storage changes from other tabs', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'default'));
    
    // Simulate storage event from another tab
    act(() => {
      const event = new StorageEvent('storage', {
        key: 'test-key',
        newValue: '"updated-from-other-tab"',
        oldValue: null,
      });
      window.dispatchEvent(event);
    });
    
    expect(result.current.value).toBe('updated-from-other-tab');
  });

  it('should ignore storage events for different keys', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'default'));
    
    // Simulate storage event for different key
    act(() => {
      const event = new StorageEvent('storage', {
        key: 'different-key',
        newValue: '"should-not-update"',
        oldValue: null,
      });
      window.dispatchEvent(event);
    });
    
    expect(result.current.value).toBe('default');
  });

  it('should handle null newValue in storage event', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'default'));
    
    // Simulate storage event with null newValue
    act(() => {
      const event = new StorageEvent('storage', {
        key: 'test-key',
        newValue: null,
        oldValue: '"old-value"',
      });
      window.dispatchEvent(event);
    });
    
    expect(result.current.value).toBe('default'); // Should not change
  });
});
