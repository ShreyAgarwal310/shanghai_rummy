import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useAuth } from '../hooks/useAuth'
import { navigateTo } from '../utils/navigate'
import './LoginPage.css'

type AuthMode = 'signin' | 'signup'

function LoginPage() {
  const { signIn, signUp, loading, isConfigured, errorMessage, user } = useAuth()
  const [mode, setMode] = useState<AuthMode>('signin')
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [statusMessage, setStatusMessage] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (user) {
      navigateTo('/profile')
    }
  }, [user])

  if (user) {
    return null
  }

  const handleBackClick = () => {
    navigateTo('/')
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitting(true)
    setSubmitError('')
    setStatusMessage('')

    try {
      if (mode === 'signin') {
        await signIn({ email, password })
        navigateTo('/profile')
        return
      }

      const nextMessage = await signUp({ email, password, displayName })
      setStatusMessage(nextMessage ?? 'Account created. You are signed in and can finish your profile now.')
      if (!nextMessage) {
        navigateTo('/profile')
      }
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Authentication failed.')
    } finally {
      setSubmitting(false)
    }
  }

  const disabled = loading || submitting || !isConfigured

  return (
    <main className="login-page" aria-label="Account sign in">
      <div className="login-page__frame" aria-hidden="true" />

      <button type="button" className="login-page__back-btn" onClick={handleBackClick}>
        ← Back to Lobby
      </button>

      <section className="login-page__card">
        <h1 className="login-page__title">Join the Table</h1>
        <p className="login-page__subtitle">
          Sign in to save your profile and connect your scores to the leaderboard.
        </p>

        <div className="login-page__mode-switch" role="tablist" aria-label="Authentication mode">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'signin'}
            className={`login-page__mode-btn ${mode === 'signin' ? 'is-active' : ''}`}
            onClick={() => setMode('signin')}
          >
            Sign In
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'signup'}
            className={`login-page__mode-btn ${mode === 'signup' ? 'is-active' : ''}`}
            onClick={() => setMode('signup')}
          >
            Create Account
          </button>
        </div>

        <form className="login-page__form" onSubmit={handleSubmit}>
          {mode === 'signup' ? (
            <label className="login-page__field">
              <span>Display Name</span>
              <input
                type="text"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="Card shark name"
                required
              />
            </label>
          ) : null}

          <label className="login-page__field">
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </label>

          <label className="login-page__field">
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="At least 6 characters"
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              minLength={6}
              required
            />
          </label>

          <button type="submit" className="login-page__submit-btn" disabled={disabled}>
            {submitting ? 'Working...' : mode === 'signin' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        {submitError ? <p className="login-page__message login-page__message--error">{submitError}</p> : null}
        {statusMessage ? <p className="login-page__message">{statusMessage}</p> : null}
        {errorMessage && !submitError ? <p className="login-page__message login-page__message--error">{errorMessage}</p> : null}
      </section>
    </main>
  )
}

export default LoginPage
