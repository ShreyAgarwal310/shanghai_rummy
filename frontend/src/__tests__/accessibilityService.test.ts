
import { describe, it, expect, beforeEach } from 'vitest'
import {
  defaultAccessibilityPreferences,
  getAccessibilityPreferences,
  applyAccessibilityPreferences,
  updateAccessibilityPreferences,
  initializeAccessibilityPreferences,
  type AccessibilityPreferences,
} from '../services/accessibilityService'

const STORAGE_KEY = 'shanghai_rummy_accessibility_preferences'

const allOnPrefs: AccessibilityPreferences = {
  highContrast: true,
  reducedMotion: true,
  largerText: true,
  screenReaderHints: true,
  colorAssistLabels: true,
}

const allOffPrefs: AccessibilityPreferences = {
  highContrast: false,
  reducedMotion: false,
  largerText: false,
  screenReaderHints: false,
  colorAssistLabels: false,
}

beforeEach(() => {
  localStorage.clear()
  // Reset all classes and attributes applied by the service
  const root = document.documentElement
  root.classList.remove(
    'a11y-high-contrast',
    'a11y-reduced-motion',
    'a11y-large-text',
    'a11y-color-labels',
  )
  root.removeAttribute('data-a11y-screen-reader-hints')
  // Remove any test nodes added during DOM tests
  document.querySelectorAll('[data-a11y-description]').forEach((n) => n.remove())
})

// getAccessibilityPreferences

describe('getAccessibilityPreferences', () => {
  it('returns default preferences when localStorage is empty', () => {
    expect(getAccessibilityPreferences()).toEqual(defaultAccessibilityPreferences)
  })

  it('returns parsed preferences when localStorage has a valid entry', () => {
    const prefs: AccessibilityPreferences = {
      highContrast: true,
      reducedMotion: false,
      largerText: true,
      screenReaderHints: false,
      colorAssistLabels: true,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))
    expect(getAccessibilityPreferences()).toEqual(prefs)
  })

  it('returns defaults when localStorage contains malformed JSON', () => {
    localStorage.setItem(STORAGE_KEY, '{ not valid json <<<')
    expect(getAccessibilityPreferences()).toEqual(defaultAccessibilityPreferences)
  })

  it('returns defaults when localStorage JSON has missing fields', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ highContrast: true }))
    expect(getAccessibilityPreferences()).toEqual(defaultAccessibilityPreferences)
  })

  it('returns defaults when localStorage JSON has wrong field types', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      highContrast: 'yes',
      reducedMotion: 1,
      largerText: null,
      screenReaderHints: true,
      colorAssistLabels: true,
    }))
    expect(getAccessibilityPreferences()).toEqual(defaultAccessibilityPreferences)
  })

  it('returns defaults when localStorage value is null', () => {
    localStorage.setItem(STORAGE_KEY, 'null')
    expect(getAccessibilityPreferences()).toEqual(defaultAccessibilityPreferences)
  })
})

// defaultAccessibilityPreferences shape

describe('defaultAccessibilityPreferences', () => {
  it('has screenReaderHints enabled by default', () => {
    expect(defaultAccessibilityPreferences.screenReaderHints).toBe(true)
  })

  it('has colorAssistLabels enabled by default', () => {
    expect(defaultAccessibilityPreferences.colorAssistLabels).toBe(true)
  })

  it('has highContrast disabled by default', () => {
    expect(defaultAccessibilityPreferences.highContrast).toBe(false)
  })

  it('has reducedMotion disabled by default', () => {
    expect(defaultAccessibilityPreferences.reducedMotion).toBe(false)
  })

  it('has largerText disabled by default', () => {
    expect(defaultAccessibilityPreferences.largerText).toBe(false)
  })
})

// applyAccessibilityPreferences — CSS class toggles

describe('applyAccessibilityPreferences — CSS classes', () => {
  it('adds a11y-high-contrast class when highContrast is true', () => {
    applyAccessibilityPreferences({ ...allOffPrefs, highContrast: true })
    expect(document.documentElement.classList.contains('a11y-high-contrast')).toBe(true)
  })

  it('removes a11y-high-contrast class when highContrast is false', () => {
    document.documentElement.classList.add('a11y-high-contrast')
    applyAccessibilityPreferences(allOffPrefs)
    expect(document.documentElement.classList.contains('a11y-high-contrast')).toBe(false)
  })

  it('adds a11y-reduced-motion class when reducedMotion is true', () => {
    applyAccessibilityPreferences({ ...allOffPrefs, reducedMotion: true })
    expect(document.documentElement.classList.contains('a11y-reduced-motion')).toBe(true)
  })

  it('removes a11y-reduced-motion class when reducedMotion is false', () => {
    document.documentElement.classList.add('a11y-reduced-motion')
    applyAccessibilityPreferences(allOffPrefs)
    expect(document.documentElement.classList.contains('a11y-reduced-motion')).toBe(false)
  })

  it('adds a11y-large-text class when largerText is true', () => {
    applyAccessibilityPreferences({ ...allOffPrefs, largerText: true })
    expect(document.documentElement.classList.contains('a11y-large-text')).toBe(true)
  })

  it('removes a11y-large-text class when largerText is false', () => {
    document.documentElement.classList.add('a11y-large-text')
    applyAccessibilityPreferences(allOffPrefs)
    expect(document.documentElement.classList.contains('a11y-large-text')).toBe(false)
  })

  it('adds a11y-color-labels class when colorAssistLabels is true', () => {
    applyAccessibilityPreferences({ ...allOffPrefs, colorAssistLabels: true })
    expect(document.documentElement.classList.contains('a11y-color-labels')).toBe(true)
  })

  it('removes a11y-color-labels class when colorAssistLabels is false', () => {
    document.documentElement.classList.add('a11y-color-labels')
    applyAccessibilityPreferences(allOffPrefs)
    expect(document.documentElement.classList.contains('a11y-color-labels')).toBe(false)
  })

  it('sets all four classes simultaneously when all prefs are true', () => {
    applyAccessibilityPreferences(allOnPrefs)
    const cl = document.documentElement.classList
    expect(cl.contains('a11y-high-contrast')).toBe(true)
    expect(cl.contains('a11y-reduced-motion')).toBe(true)
    expect(cl.contains('a11y-large-text')).toBe(true)
    expect(cl.contains('a11y-color-labels')).toBe(true)
  })
})

// applyAccessibilityPreferences — screenReaderHints attribute

describe('applyAccessibilityPreferences — screenReaderHints attribute', () => {
  it('sets data-a11y-screen-reader-hints to "on" when screenReaderHints is true', () => {
    applyAccessibilityPreferences({ ...allOffPrefs, screenReaderHints: true })
    expect(document.documentElement.getAttribute('data-a11y-screen-reader-hints')).toBe('on')
  })

  it('sets data-a11y-screen-reader-hints to "off" when screenReaderHints is false', () => {
    applyAccessibilityPreferences(allOffPrefs)
    expect(document.documentElement.getAttribute('data-a11y-screen-reader-hints')).toBe('off')
  })
})

// applyAccessibilityPreferences — applyScreenReaderDescriptions (DOM nodes)

describe('applyAccessibilityPreferences — screen reader description nodes', () => {
  function createDescribedNode(description: string): HTMLElement {
    const el = document.createElement('div')
    el.dataset.a11yDescription = description
    document.body.appendChild(el)
    return el
  }

  it('sets aria-description on nodes when screenReaderHints is true', () => {
    const node = createDescribedNode('Draw a card from the deck')
    applyAccessibilityPreferences({ ...allOffPrefs, screenReaderHints: true })
    expect(node.getAttribute('aria-description')).toBe('Draw a card from the deck')
  })

  it('removes aria-description from nodes when screenReaderHints is false', () => {
    const node = createDescribedNode('Draw a card from the deck')
    node.setAttribute('aria-description', 'Draw a card from the deck')
    applyAccessibilityPreferences(allOffPrefs)
    expect(node.getAttribute('aria-description')).toBeNull()
  })

  it('handles multiple described nodes simultaneously', () => {
    const node1 = createDescribedNode('First hint')
    const node2 = createDescribedNode('Second hint')
    applyAccessibilityPreferences({ ...allOffPrefs, screenReaderHints: true })
    expect(node1.getAttribute('aria-description')).toBe('First hint')
    expect(node2.getAttribute('aria-description')).toBe('Second hint')
  })
})

// updateAccessibilityPreferences

describe('updateAccessibilityPreferences', () => {
  it('persists preferences to localStorage as JSON', () => {
    updateAccessibilityPreferences(allOnPrefs)
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
    expect(stored).toEqual(allOnPrefs)
  })

  it('also applies the preferences to the DOM', () => {
    updateAccessibilityPreferences({ ...allOffPrefs, highContrast: true })
    expect(document.documentElement.classList.contains('a11y-high-contrast')).toBe(true)
  })

  it('overwrites a previous stored value', () => {
    updateAccessibilityPreferences(allOnPrefs)
    updateAccessibilityPreferences(allOffPrefs)
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
    expect(stored.highContrast).toBe(false)
  })
})

// initializeAccessibilityPreferences

describe('initializeAccessibilityPreferences', () => {
  it('applies default preferences to DOM when localStorage is empty', () => {
    initializeAccessibilityPreferences()
    // Defaults: highContrast=false → class should NOT be present
    expect(document.documentElement.classList.contains('a11y-high-contrast')).toBe(false)
    // Defaults: screenReaderHints=true → attribute should be 'on'
    expect(document.documentElement.getAttribute('data-a11y-screen-reader-hints')).toBe('on')
  })

  it('applies stored preferences to DOM', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allOnPrefs))
    initializeAccessibilityPreferences()
    expect(document.documentElement.classList.contains('a11y-high-contrast')).toBe(true)
    expect(document.documentElement.classList.contains('a11y-reduced-motion')).toBe(true)
  })
})
