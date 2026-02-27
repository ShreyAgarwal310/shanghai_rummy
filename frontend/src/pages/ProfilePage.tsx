import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import {
  defaultAccessibilityPreferences,
  getAccessibilityPreferences,
  updateAccessibilityPreferences,
} from '../services/accessibilityService'
import type { AccessibilityPreferences } from '../services/accessibilityService'
import './ProfilePage.css'

function ProfilePage() {
  const [displayName, setDisplayName] = useState('')
  const [preferredName, setPreferredName] = useState('')
  const [bio, setBio] = useState('')
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [accessibility, setAccessibility] = useState<AccessibilityPreferences>(() => getAccessibilityPreferences())
  const [inviteNotifications, setInviteNotifications] = useState(true)
  const [saveMessage, setSaveMessage] = useState('')

  const fileInputRef = useRef<HTMLInputElement>(null)
  const objectUrlRef = useRef<string | null>(null)

  useEffect(
    () => () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current)
      }
    },
    [],
  )

  useEffect(() => {
    updateAccessibilityPreferences(accessibility)
  }, [accessibility])

  const clearObjectUrl = () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current)
      objectUrlRef.current = null
    }
  }

  const handleBackClick = () => {
    window.location.assign('/')
  }

  const handlePickImageClick = () => {
    fileInputRef.current?.click()
  }

  const handleAvatarFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (!selectedFile) {
      return
    }

    clearObjectUrl()
    const imageUrl = URL.createObjectURL(selectedFile)
    objectUrlRef.current = imageUrl
    setAvatarPreview(imageUrl)
    setSaveMessage('')
  }

  const handleRemoveAvatar = () => {
    clearObjectUrl()
    setAvatarPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    setSaveMessage('')
  }

  const handleReset = () => {
    clearObjectUrl()
    setDisplayName('')
    setPreferredName('')
    setBio('')
    setAvatarPreview(null)
    setAccessibility(defaultAccessibilityPreferences)
    setInviteNotifications(true)
    setSaveMessage('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const updateAccessibilitySetting = (key: keyof AccessibilityPreferences, value: boolean) => {
    setAccessibility((currentPreferences) => ({ ...currentPreferences, [key]: value }))
    setSaveMessage('')
  }

  const handleSave = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaveMessage('Profile preferences saved locally. Backend can now bind real user fields here.')
  }

  return (
    <main className="profile-page" aria-label="Profile settings">
      <button
        type="button"
        className="profile-page__back-btn"
        onClick={handleBackClick}
        data-a11y-description="Return to the home lobby screen."
      >
        ← Back to Lobby
      </button>

      <section className="profile-page__content">
        <header className="profile-page__title-card">
          <h1 className="profile-page__title">Profile Settings</h1>
          <p className="profile-page__subtitle">Identity, avatar, and accessibility preferences</p>
        </header>

        <form className="profile-page__form" onSubmit={handleSave}>
          <div className="profile-page__grid">
            <section className="profile-card">
              <h2 className="profile-card__title">Identity</h2>

              <div className="profile-avatar">
                <div className="profile-avatar__circle" aria-hidden="true">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="" className="profile-avatar__image" />
                  ) : (
                    <span className="profile-avatar__placeholder">👤</span>
                  )}
                </div>

                <div className="profile-avatar__actions">
                  <button
                    type="button"
                    className="profile-card__button profile-card__button--primary"
                    onClick={handlePickImageClick}
                    data-a11y-description="Open file picker to upload a profile image."
                  >
                    Upload / Change Photo
                  </button>
                  <button
                    type="button"
                    className="profile-card__button profile-card__button--secondary"
                    onClick={handleRemoveAvatar}
                    data-a11y-description="Remove the current profile image preview."
                  >
                    Remove Photo
                  </button>
                  <input
                    ref={fileInputRef}
                    className="profile-avatar__input"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarFileChange}
                  />
                </div>
              </div>

              <label className="profile-field">
                <span>Display Name</span>
                <input
                  type="text"
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  placeholder="Enter display name"
                />
              </label>

              <label className="profile-field">
                <span>Preferred Name</span>
                <input
                  type="text"
                  value={preferredName}
                  onChange={(event) => setPreferredName(event.target.value)}
                  placeholder="Enter preferred name"
                />
              </label>

              <label className="profile-field">
                <span>Bio</span>
                <textarea
                  value={bio}
                  onChange={(event) => setBio(event.target.value)}
                  placeholder="Tell the table a little about yourself"
                  maxLength={180}
                  rows={4}
                />
              </label>
            </section>

            <section className="profile-card">
              <h2 className="profile-card__title">Accessibility</h2>
              <p className="profile-card__note">These preferences are UI-only for now and ready for backend sync.</p>

              <label className="profile-toggle">
                <input
                  type="checkbox"
                  checked={accessibility.highContrast}
                  onChange={(event) => updateAccessibilitySetting('highContrast', event.target.checked)}
                />
                <span>High Contrast Mode</span>
                <small>Increase color contrast across cards and text.</small>
              </label>

              <label className="profile-toggle">
                <input
                  type="checkbox"
                  checked={accessibility.reducedMotion}
                  onChange={(event) => updateAccessibilitySetting('reducedMotion', event.target.checked)}
                />
                <span>Reduced Motion</span>
                <small>Reduce animation intensity and movement effects.</small>
              </label>

              <label className="profile-toggle">
                <input
                  type="checkbox"
                  checked={accessibility.largerText}
                  onChange={(event) => updateAccessibilitySetting('largerText', event.target.checked)}
                />
                <span>Larger Text</span>
                <small>Increase font sizes in game and utility screens.</small>
              </label>

              <label className="profile-toggle">
                <input
                  type="checkbox"
                  checked={accessibility.screenReaderHints}
                  onChange={(event) => updateAccessibilitySetting('screenReaderHints', event.target.checked)}
                />
                <span>Screen Reader Hints</span>
                <small>Add extra descriptive labels for controls and cards.</small>
              </label>

              <label className="profile-toggle">
                <input
                  type="checkbox"
                  checked={accessibility.colorAssistLabels}
                  onChange={(event) => updateAccessibilitySetting('colorAssistLabels', event.target.checked)}
                />
                <span>Color Assist Labels</span>
                <small>Show text markers alongside color-only indicators.</small>
              </label>
            </section>
          </div>

          <section className="profile-card profile-card--full">
            <h2 className="profile-card__title">Notifications & Privacy</h2>
            <label className="profile-toggle">
              <input
                type="checkbox"
                checked={inviteNotifications}
                onChange={(event) => setInviteNotifications(event.target.checked)}
              />
              <span>Match Invite Notifications</span>
              <small>Receive alerts when friends invite you to a table.</small>
            </label>
          </section>

          <footer className="profile-page__actions">
            <button
              type="submit"
              className="profile-card__button profile-card__button--primary"
              data-a11y-description="Save all profile and accessibility preferences."
            >
              Save Profile
            </button>
            <button
              type="button"
              className="profile-card__button profile-card__button--secondary"
              onClick={handleReset}
              data-a11y-description="Reset profile and accessibility fields to defaults."
            >
              Reset Fields
            </button>
          </footer>

          {saveMessage ? <p className="profile-page__save-message">{saveMessage}</p> : null}
        </form>
      </section>
    </main>
  )
}

export default ProfilePage
