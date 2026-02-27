export type AccessibilityPreferences = {
  highContrast: boolean
  reducedMotion: boolean
  largerText: boolean
  screenReaderHints: boolean
  colorAssistLabels: boolean
}

const ACCESSIBILITY_STORAGE_KEY = 'shanghai_rummy_accessibility_preferences'

export const defaultAccessibilityPreferences: AccessibilityPreferences = {
  highContrast: false,
  reducedMotion: false,
  largerText: false,
  screenReaderHints: true,
  colorAssistLabels: true,
}

function isAccessibilityPreferences(value: unknown): value is AccessibilityPreferences {
  if (!value || typeof value !== 'object') {
    return false
  }

  const prefs = value as Record<string, unknown>

  return (
    typeof prefs.highContrast === 'boolean' &&
    typeof prefs.reducedMotion === 'boolean' &&
    typeof prefs.largerText === 'boolean' &&
    typeof prefs.screenReaderHints === 'boolean' &&
    typeof prefs.colorAssistLabels === 'boolean'
  )
}

export function getAccessibilityPreferences(): AccessibilityPreferences {
  const storedPreferences = localStorage.getItem(ACCESSIBILITY_STORAGE_KEY)
  if (!storedPreferences) {
    return defaultAccessibilityPreferences
  }

  try {
    const parsedPreferences = JSON.parse(storedPreferences)
    if (isAccessibilityPreferences(parsedPreferences)) {
      return parsedPreferences
    }
  } catch {
    return defaultAccessibilityPreferences
  }

  return defaultAccessibilityPreferences
}

function applyScreenReaderDescriptions(screenReaderHintsEnabled: boolean) {
  const describedNodes = document.querySelectorAll<HTMLElement>('[data-a11y-description]')
  describedNodes.forEach((node) => {
    const description = node.dataset.a11yDescription
    if (screenReaderHintsEnabled && description) {
      node.setAttribute('aria-description', description)
    } else {
      node.removeAttribute('aria-description')
    }
  })
}

export function applyAccessibilityPreferences(preferences: AccessibilityPreferences) {
  const rootElement = document.documentElement

  rootElement.classList.toggle('a11y-high-contrast', preferences.highContrast)
  rootElement.classList.toggle('a11y-reduced-motion', preferences.reducedMotion)
  rootElement.classList.toggle('a11y-large-text', preferences.largerText)
  rootElement.classList.toggle('a11y-color-labels', preferences.colorAssistLabels)
  rootElement.setAttribute('data-a11y-screen-reader-hints', preferences.screenReaderHints ? 'on' : 'off')

  applyScreenReaderDescriptions(preferences.screenReaderHints)
}

export function updateAccessibilityPreferences(preferences: AccessibilityPreferences) {
  localStorage.setItem(ACCESSIBILITY_STORAGE_KEY, JSON.stringify(preferences))
  applyAccessibilityPreferences(preferences)
}

export function initializeAccessibilityPreferences() {
  applyAccessibilityPreferences(getAccessibilityPreferences())
}

