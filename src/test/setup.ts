// jsdom does not implement PointerEvent; a MouseEvent subclass carries clientX/Y.
if (typeof window !== 'undefined' && !('PointerEvent' in window)) {
  class PointerEventPolyfill extends MouseEvent {
    pointerId: number;
    pointerType: string;
    constructor(type: string, init: PointerEventInit = {}) {
      super(type, init);
      this.pointerId = init.pointerId ?? 1;
      this.pointerType = init.pointerType ?? 'mouse';
    }
  }
  (window as unknown as { PointerEvent: unknown }).PointerEvent = PointerEventPolyfill;
}

// Newer Node versions expose their own (disabled) localStorage global that
// shadows jsdom's. Provide a simple in-memory Storage when that happens.
function hasWorkingStorage() {
  try {
    return typeof globalThis.localStorage?.clear === 'function';
  } catch {
    return false;
  }
}

if (!hasWorkingStorage()) {
  class MemoryStorage implements Storage {
    private data = new Map<string, string>();
    get length() {
      return this.data.size;
    }
    clear() {
      this.data.clear();
    }
    getItem(key: string) {
      return this.data.has(key) ? this.data.get(key)! : null;
    }
    key(index: number) {
      return Array.from(this.data.keys())[index] ?? null;
    }
    removeItem(key: string) {
      this.data.delete(key);
    }
    setItem(key: string, value: string) {
      this.data.set(key, String(value));
    }
  }
  const storage = new MemoryStorage();
  for (const target of [globalThis, typeof window !== 'undefined' ? window : undefined]) {
    if (target) Object.defineProperty(target, 'localStorage', { value: storage, configurable: true, writable: true });
  }
}

if (typeof Element !== 'undefined') {
  Element.prototype.setPointerCapture ??= () => {};
  Element.prototype.releasePointerCapture ??= () => {};
  Element.prototype.hasPointerCapture ??= () => false;
}
