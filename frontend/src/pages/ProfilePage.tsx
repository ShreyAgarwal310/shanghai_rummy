import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { navigateTo } from '../utils/navigate'
import {
  defaultAccessibilityPreferences,
  getAccessibilityPreferences,
  updateAccessibilityPreferences,
} from '../services/accessibilityService'
import type { AccessibilityPreferences } from '../services/accessibilityService'
import './ProfilePage.css'

function ProfilePage() {
  const { user, profile, loading, isConfigured, errorMessage, refreshProfile, signOut, changePassword } = useAuth()
  const [displayName, setDisplayName] = useState('')
  const [preferredName, setPreferredName] = useState('')
  const [bio, setBio] = useState('')
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [accessibility, setAccessibility] = useState<AccessibilityPreferences>(() => getAccessibilityPreferences())
  const [inviteNotifications, setInviteNotifications] = useState(true)
  const [saveMessage, setSaveMessage] = useState('')
  const [saveError, setSaveError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordMessage, setPasswordMessage] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [isChangingPassword, setIsChangingPassword] = useState(false)

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
    if (!profile) {
      return
    }

    setDisplayName(profile.display_name ?? '')
    setPreferredName(profile.preferred_name ?? '')
    setBio(profile.bio ?? '')
    setInviteNotifications(profile.invite_notifications)
    setAccessibility(profile.accessibility_preferences ?? getAccessibilityPreferences())
  }, [profile])

  useEffect(() => {
    updateAccessibilityPreferences(accessibility)
  }, [accessibility])

  const clearObjectUrl = () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current)
      objectUrlRef.current = null
    }
  }

  const resetForm = () => {
    clearObjectUrl()
    setAvatarPreview(null)
    setDisplayName(profile?.display_name ?? '')
    setPreferredName(profile?.preferred_name ?? '')
    setBio(profile?.bio ?? '')
    setInviteNotifications(profile?.invite_notifications ?? true)
    setAccessibility(profile?.accessibility_preferences ?? defaultAccessibilityPreferences)
    setSaveError('')
    setSaveMessage('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleBackClick = () => {
    navigateTo('/')
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
    setSaveMessage('Local avatar preview updated. Persisting image uploads requires a Supabase Storage bucket.')
    setSaveError('')
  }

  const handleRemoveAvatar = () => {
    clearObjectUrl()
    setAvatarPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    setSaveMessage('')
  }

  const updateAccessibilitySetting = (key: keyof AccessibilityPreferences, value: boolean) => {
    setAccessibility((currentPreferences) => ({ ...currentPreferences, [key]: value }))
    setSaveMessage('')
    setSaveError('')
  }

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!user || !supabase) {
      return
    }

    setIsSaving(true)
    setSaveMessage('')
    setSaveError('')

    try {
      const { error } = await supabase.from('profiles').upsert({
        id: user.id,
        email: user.email ?? profile?.email ?? null,
        display_name: displayName.trim() || null,
        preferred_name: preferredName.trim() || null,
        bio: bio.trim() || null,
        invite_notifications: inviteNotifications,
        accessibility_preferences: accessibility,
      })

      if (error) {
        throw error
      }

      await refreshProfile()
      setSaveMessage('Profile saved to Supabase.')
    } catch (nextError) {
      setSaveError(nextError instanceof Error ? nextError.message : 'Unable to save your profile.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleChangePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setPasswordMessage('')
    setPasswordError('')

    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters.')
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.')
      return
    }

    setIsChangingPassword(true)
    try {
      await changePassword(newPassword)
      setPasswordMessage('Password updated successfully.')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Unable to update password.')
    } finally {
      setIsChangingPassword(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    navigateTo('/')
  }

  if (loading) {
    return (
      <main className="profile-page" aria-label="Profile settings">
        <section className="profile-page__content">
          <header className="profile-page__title-card">
            <h1 className="profile-page__title">Loading profile...</h1>
          </header>
        </section>
      </main>
    )
  }

  if (!isConfigured || !user) {
    return (
      <main className="profile-page" aria-label="Profile settings">
        <button type="button" className="profile-page__back-btn" onClick={handleBackClick}>
          ← Back to Lobby
        </button>
        <section className="profile-page__content">
          <header className="profile-page__title-card">
            <p className="profile-page__subtitle">Authentication required</p>
            <h1 className="profile-page__title">Profile Settings</h1>
            <p className="profile-page__hero-copy">
              {isConfigured
                ? 'Sign in first so your profile and future leaderboard scores map to a real player record.'
                : 'Add your Supabase URL and anon key before authentication can work.'}
            </p>
            {errorMessage ? <p className="profile-page__save-message">{errorMessage}</p> : null}
            <div className="profile-page__actions">
              <button type="button" className="profile-card__button profile-card__button--primary" onClick={() => navigateTo('/login')}>
                Open Login
              </button>
            </div>
          </header>
        </section>
      </main>
    )
  }

  return (
    <main className="profile-page" aria-label="Profile settings">
      <div className="profile-frame" aria-hidden="true">
        <span className="profile-frame__corner profile-frame__corner--tl" />
        <span className="profile-frame__corner profile-frame__corner--tr" />
        <span className="profile-frame__corner profile-frame__corner--bl" />
        <span className="profile-frame__corner profile-frame__corner--br" />
        <span className="profile-frame__mid profile-frame__mid--top">◆</span>
        <span className="profile-frame__mid profile-frame__mid--right">◆</span>
        <span className="profile-frame__mid profile-frame__mid--bottom">◆</span>
        <span className="profile-frame__mid profile-frame__mid--left">◆</span>
      </div>

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
          <div className="profile-page__pretitle" aria-hidden="true">
            <span className="profile-page__ornament-line" />
            <span className="profile-page__ornament-gem">◆</span>
            <span className="profile-page__ornament-line" />
          </div>
          <p className="profile-page__subtitle">Identity · Avatar · Accessibility</p>
          <h1 className="profile-page__title">Profile Settings</h1>
          <p className="profile-page__hero-copy">
            Signed in as <strong>{profile?.display_name ?? user.email}</strong>
          </p>
          <div className="profile-page__title-ornament" aria-hidden="true">
            <span className="profile-page__ornament-line" />
            <span className="profile-page__ornament-gem">◈</span>
            <span className="profile-page__ornament-gem profile-page__ornament-gem--main">◆</span>
            <span className="profile-page__ornament-gem">◈</span>
            <span className="profile-page__ornament-line" />
          </div>
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
                    <span className="profile-avatar__placeholder">♠</span>
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
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save Profile'}
            </button>
            <button
              type="button"
              className="profile-card__button profile-card__button--secondary"
              onClick={resetForm}
              data-a11y-description="Reset profile and accessibility fields to saved values."
            >
              Reset Fields
            </button>
            <button
              type="button"
              className="profile-card__button profile-card__button--secondary"
              onClick={handleSignOut}
            >
              Sign Out
            </button>
          </footer>

          {saveMessage ? <p className="profile-page__save-message">{saveMessage}</p> : null}
          {saveError ? <p className="profile-page__save-message">{saveError}</p> : null}
          {errorMessage && !saveError ? <p className="profile-page__save-message">{errorMessage}</p> : null}
        </form>

        <form className="profile-page__form" onSubmit={handleChangePassword}>
          <section className="profile-card profile-card--full">
            <h2 className="profile-card__title">Security</h2>

            <label className="profile-field">
              <span>New Password</span>
              <input
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                placeholder="Enter new password"
                autoComplete="new-password"
              />
            </label>

            <label className="profile-field">
              <span>Confirm Password</span>
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Confirm new password"
                autoComplete="new-password"
              />
            </label>

            <footer className="profile-page__actions">
              <button
                type="submit"
                className="profile-card__button profile-card__button--primary"
                disabled={isChangingPassword}
                data-a11y-description="Update your account password."
              >
                {isChangingPassword ? 'Updating...' : 'Change Password'}
              </button>
            </footer>

            {passwordMessage ? <p className="profile-page__save-message">{passwordMessage}</p> : null}
            {passwordError ? <p className="profile-page__save-message">{passwordError}</p> : null}
          </section>
        </form>
      </section>
    </main>
  )
}

export default ProfilePage
