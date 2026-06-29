import { afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom'

afterEach(() => {
  cleanup()
  vi.clearAllMocks()    // limpa call history de vi.fn() hoisted
  vi.restoreAllMocks()  // restaura spyOn ao original
  localStorage.clear()
})

// Radix UI usa ResizeObserver (não existente no jsdom)
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// Radix UI usa PointerEvent para interacções de acessibilidade
if (!global.PointerEvent) {
  class PointerEvent extends MouseEvent {
    constructor(type: string, params: PointerEventInit = {}) {
      super(type, params)
    }
  }
  global.PointerEvent = PointerEvent as any
}

// cmdk (Command) usa scrollIntoView ao navegar pelos itens
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = vi.fn()
}

// Radix UI Popover/Dialog usa hasPointerCapture/setPointerCapture
if (!HTMLElement.prototype.hasPointerCapture) {
  HTMLElement.prototype.hasPointerCapture = vi.fn(() => false)
}
if (!HTMLElement.prototype.setPointerCapture) {
  HTMLElement.prototype.setPointerCapture = vi.fn()
}
if (!HTMLElement.prototype.releasePointerCapture) {
  HTMLElement.prototype.releasePointerCapture = vi.fn()
}

// motion/react usa matchMedia para prefers-reduced-motion
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})
