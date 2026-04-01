import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { API_BASE, setToken } from '@/lib/api'

export const Route = createFileRoute('/login')({ component: LoginPage })

type Tab = 'login' | 'register'
type ForgotStep = 'email' | 'answer' | 'reset'

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  )
}

function PasswordInput({
  id,
  value,
  onChange,
  placeholder,
  autoComplete,
  minLength,
}: {
  id: string
  value: string
  onChange: (v: string) => void
  placeholder: string
  autoComplete: string
  minLength?: number
}) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <input
        id={id}
        type={show ? 'text' : 'password'}
        autoComplete={autoComplete}
        required
        minLength={minLength}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] px-4 py-2.5 pr-10 text-sm text-[var(--sea-ink)] placeholder:text-[var(--sea-ink-soft)] outline-none transition focus:border-[var(--lagoon)] focus:ring-2 focus:ring-[rgba(79,184,178,0.25)]"
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--sea-ink-soft)] hover:text-[var(--sea-ink)] transition"
        tabIndex={-1}
        aria-label={show ? 'Hide password' : 'Show password'}
      >
        <EyeIcon open={show} />
      </button>
    </div>
  )
}

function LoginPage() {
  const navigate = useNavigate()
  const { setUser } = useAuth()
  const [tab, setTab] = useState<Tab>('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Login form state
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  // Register form state
  const [registerName, setRegisterName] = useState('')
  const [registerEmail, setRegisterEmail] = useState('')
  const [registerPassword, setRegisterPassword] = useState('')
  const [registerConfirm, setRegisterConfirm] = useState('')

  // Forgot password state
  const [showForgot, setShowForgot] = useState(false)
  const [forgotStep, setForgotStep] = useState<ForgotStep>('email')
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotQuestion, setForgotQuestion] = useState('')
  const [forgotAnswer, setForgotAnswer] = useState('')
  const [forgotNewPassword, setForgotNewPassword] = useState('')
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('')

  const pwChecks = {
    length: registerPassword.length >= 8,
    uppercase: /[A-Z]/.test(registerPassword),
    number: /[0-9]/.test(registerPassword),
    special: /[^a-zA-Z0-9]/.test(registerPassword),
  }
  const pwValid = Object.values(pwChecks).every(Boolean)

  const forgotPwChecks = {
    length: forgotNewPassword.length >= 8,
    uppercase: /[A-Z]/.test(forgotNewPassword),
    number: /[0-9]/.test(forgotNewPassword),
    special: /[^a-zA-Z0-9]/.test(forgotNewPassword),
  }
  const forgotPwValid = Object.values(forgotPwChecks).every(Boolean)

  function switchTab(t: Tab) {
    setTab(t)
    setError(null)
    setSuccessMsg(null)
    setShowForgot(false)
    resetForgot()
  }

  function resetForgot() {
    setForgotStep('email')
    setForgotEmail('')
    setForgotQuestion('')
    setForgotAnswer('')
    setForgotNewPassword('')
    setForgotConfirmPassword('')
  }

  function openForgot() {
    setShowForgot(true)
    setError(null)
    setSuccessMsg(null)
    resetForgot()
  }

  function closeForgot() {
    setShowForgot(false)
    setError(null)
    resetForgot()
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/users/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || data.message || `Login failed (${res.status})`)
      setToken(data.access_token)
      localStorage.setItem('user_id', data.user_id)
      localStorage.setItem('username', data.username)
      setUser({ username: data.username, user_id: data.user_id })
      navigate({ to: '/' })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!pwValid) { setError('Please make sure your password meets all requirements.'); return }
    if (registerPassword !== registerConfirm) { setError('Passwords do not match'); return }
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/users/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username: registerName, email: registerEmail, password: registerPassword }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || data.message || `Registration failed (${res.status})`)
      setToken(data.access_token)
      localStorage.setItem('user_id', data.user_id)
      localStorage.setItem('username', data.username)
      setUser({ username: data.username, user_id: data.user_id })
      navigate({ to: '/' })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  async function handleForgotEmail(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/users/auth/security-question`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || data.message || 'Email not found')
      setForgotQuestion(data)
      setForgotStep('answer')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  function handleForgotAnswer(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!forgotAnswer.trim()) { setError('Please enter your answer'); return }
    setForgotStep('reset')
  }

  async function handleForgotReset(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!forgotPwValid) { setError('Please make sure your new password meets all requirements.'); return }
    if (forgotNewPassword !== forgotConfirmPassword) { setError('Passwords do not match'); return }
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/users/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: forgotEmail,
          security_answer: forgotAnswer,
          new_password: forgotNewPassword,
          confirm_password: forgotConfirmPassword,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || data.message || 'Reset failed')
      setShowForgot(false)
      resetForgot()
      setSuccessMsg('Password reset! You can now sign in with your new password.')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const inputClass = 'w-full rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] px-4 py-2.5 text-sm text-[var(--sea-ink)] placeholder:text-[var(--sea-ink-soft)] outline-none transition focus:border-[var(--lagoon)] focus:ring-2 focus:ring-[rgba(79,184,178,0.25)]'
  const labelClass = 'mb-1.5 block text-sm font-semibold text-[var(--sea-ink)]'
  const submitClass = 'mt-2 w-full rounded-xl bg-[var(--lagoon)] py-2.5 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(79,184,178,0.4)] transition hover:-translate-y-0.5 hover:bg-[var(--lagoon-deep)] disabled:opacity-60 disabled:cursor-not-allowed'
  const pwCheckList = (checks: typeof pwChecks) => (
    <ul className="mt-2 space-y-1">
      {[
        { key: 'length', label: 'At least 8 characters' },
        { key: 'uppercase', label: 'At least 1 uppercase letter' },
        { key: 'number', label: 'At least 1 number' },
        { key: 'special', label: 'At least 1 special character (!@#$...)' },
      ].map(({ key, label }) => (
        <li key={key} className={`flex items-center gap-1.5 text-xs ${checks[key as keyof typeof checks] ? 'text-green-600' : 'text-red-500'}`}>
          <span>{checks[key as keyof typeof checks] ? '✓' : '✗'}</span>
          {label}
        </li>
      ))}
    </ul>
  )

  return (
    <main className="page-wrap flex min-h-[calc(100vh-72px)] items-center justify-center px-4 py-14">
      <div className="island-shell rise-in relative w-full max-w-md overflow-hidden rounded-[2rem] px-8 py-10">
        <div className="pointer-events-none absolute -left-16 -top-20 h-48 w-48 rounded-full bg-[radial-gradient(circle,rgba(79,184,178,0.28),transparent_66%)]" />
        <div className="pointer-events-none absolute -bottom-16 -right-16 h-48 w-48 rounded-full bg-[radial-gradient(circle,rgba(47,106,74,0.16),transparent_66%)]" />

        <div className="relative mb-8 text-center">
          <Link to="/" className="inline-flex items-center gap-2 rounded-full border border-[var(--chip-line)] bg-[var(--chip-bg)] px-3 py-1.5 text-sm font-semibold text-[var(--sea-ink)] no-underline shadow-[0_8px_24px_rgba(30,90,72,0.08)]">
            <span className="h-2 w-2 rounded-full bg-[linear-gradient(90deg,#56c6be,#7ed3bf)]" />
            Nexus
          </Link>
          <h1 className="display-title mt-5 text-3xl font-bold tracking-tight text-[var(--sea-ink)]">
            {showForgot ? 'Reset Password' : tab === 'login' ? 'Welcome back' : 'Create account'}
          </h1>
          <p className="mt-2 text-sm text-[var(--sea-ink-soft)]">
            {showForgot
              ? forgotStep === 'email' ? "Enter your email and we'll find your security question."
                : forgotStep === 'answer' ? 'Answer your security question to continue.'
                : 'Choose your new password.'
              : tab === 'login' ? 'Sign in to continue to Nexus.'
              : 'Join Nexus today — it only takes a moment.'}
          </p>
        </div>

        {!showForgot && (
          <div className="relative mb-8 flex rounded-xl border border-[var(--line)] bg-[var(--surface)] p-1">
            <button type="button" onClick={() => switchTab('login')} className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${tab === 'login' ? 'bg-[var(--lagoon)] text-white shadow-sm' : 'text-[var(--sea-ink-soft)] hover:text-[var(--sea-ink)]'}`}>Sign In</button>
            <button type="button" onClick={() => switchTab('register')} className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${tab === 'register' ? 'bg-[var(--lagoon)] text-white shadow-sm' : 'text-[var(--sea-ink-soft)] hover:text-[var(--sea-ink)]'}`}>Register</button>
          </div>
        )}

        {error && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        {successMsg && <div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{successMsg}</div>}

        {/* ── FORGOT PASSWORD ── */}
        {showForgot && forgotStep === 'email' && (
          <form onSubmit={handleForgotEmail} className="space-y-4">
            <div>
              <label htmlFor="forgot-email" className={labelClass}>Email</label>
              <input id="forgot-email" type="email" required autoComplete="email" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} placeholder="you@example.com" className={inputClass} />
            </div>
            <button type="submit" disabled={loading} className={submitClass}>{loading ? 'Looking up…' : 'Continue'}</button>
            <p className="text-center text-xs text-[var(--sea-ink-soft)]">
              <button type="button" onClick={closeForgot} className="font-semibold text-[var(--lagoon-deep)] underline-offset-2 hover:underline">← Back to Sign In</button>
            </p>
          </form>
        )}

        {showForgot && forgotStep === 'answer' && (
          <form onSubmit={handleForgotAnswer} className="space-y-4">
            <div>
              <label className={labelClass}>Security Question</label>
              <p className="mb-3 rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] px-4 py-2.5 text-sm text-[var(--sea-ink)]">{forgotQuestion}</p>
              <label htmlFor="forgot-answer" className={labelClass}>Your Answer</label>
              <input id="forgot-answer" type="text" required value={forgotAnswer} onChange={(e) => setForgotAnswer(e.target.value)} placeholder="Your answer (case-insensitive)" className={inputClass} />
            </div>
            <button type="submit" className={submitClass}>Continue</button>
            <p className="text-center text-xs text-[var(--sea-ink-soft)]">
              <button type="button" onClick={() => { setForgotStep('email'); setError(null) }} className="font-semibold text-[var(--lagoon-deep)] underline-offset-2 hover:underline">← Back</button>
            </p>
          </form>
        )}

        {showForgot && forgotStep === 'reset' && (
          <form onSubmit={handleForgotReset} className="space-y-4">
            <div>
              <label htmlFor="forgot-new-pw" className={labelClass}>New Password</label>
              <PasswordInput id="forgot-new-pw" value={forgotNewPassword} onChange={setForgotNewPassword} placeholder="Min. 8 chars, 1 uppercase, 1 number, 1 symbol" autoComplete="new-password" minLength={8} />
              {forgotNewPassword.length > 0 && pwCheckList(forgotPwChecks)}
            </div>
            <div>
              <label htmlFor="forgot-confirm-pw" className={labelClass}>Confirm New Password</label>
              <PasswordInput id="forgot-confirm-pw" value={forgotConfirmPassword} onChange={setForgotConfirmPassword} placeholder="Re-enter your new password" autoComplete="new-password" />
            </div>
            <button type="submit" disabled={loading} className={submitClass}>{loading ? 'Resetting…' : 'Reset Password'}</button>
            <p className="text-center text-xs text-[var(--sea-ink-soft)]">
              <button type="button" onClick={() => { setForgotStep('answer'); setError(null) }} className="font-semibold text-[var(--lagoon-deep)] underline-offset-2 hover:underline">← Back</button>
            </p>
          </form>
        )}

        {/* ── LOGIN ── */}
        {!showForgot && tab === 'login' && (
          <form id="form-login" onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="login-email" className={labelClass}>Email</label>
              <input id="login-email" type="email" autoComplete="email" required value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} placeholder="you@example.com" className={inputClass} />
            </div>
            <div>
              <label htmlFor="login-password" className={labelClass}>Password</label>
              <PasswordInput id="login-password" value={loginPassword} onChange={setLoginPassword} placeholder="••••••••" autoComplete="current-password" />
            </div>
            <div className="flex justify-end">
              <button type="button" onClick={openForgot} className="text-xs font-medium text-[var(--lagoon-deep)] no-underline hover:underline">Forgot password?</button>
            </div>
            <button id="btn-login-submit" type="submit" disabled={loading} className={submitClass}>{loading ? 'Signing in…' : 'Sign In'}</button>
            <p className="text-center text-xs text-[var(--sea-ink-soft)]">
              Don't have an account?{' '}
              <button type="button" onClick={() => switchTab('register')} className="font-semibold text-[var(--lagoon-deep)] underline-offset-2 hover:underline">Register</button>
            </p>
          </form>
        )}

        {/* ── REGISTER ── */}
        {!showForgot && tab === 'register' && (
          <form id="form-register" onSubmit={handleRegister} className="space-y-4">
            <div>
              <label htmlFor="reg-name" className={labelClass}>Username</label>
              <input id="reg-name" type="text" autoComplete="username" required value={registerName} onChange={(e) => setRegisterName(e.target.value)} placeholder="SummonerName" className={inputClass} />
            </div>
            <div>
              <label htmlFor="reg-email" className={labelClass}>Email</label>
              <input id="reg-email" type="email" autoComplete="email" required value={registerEmail} onChange={(e) => setRegisterEmail(e.target.value)} placeholder="you@example.com" className={inputClass} />
            </div>
            <div>
              <label htmlFor="reg-password" className={labelClass}>Password</label>
              <PasswordInput id="reg-password" value={registerPassword} onChange={setRegisterPassword} placeholder="Min. 8 chars, 1 uppercase, 1 number, 1 symbol" autoComplete="new-password" minLength={8} />
              {registerPassword.length > 0 && pwCheckList(pwChecks)}
            </div>
            <div>
              <label htmlFor="reg-confirm" className={labelClass}>Confirm Password</label>
              <PasswordInput id="reg-confirm" value={registerConfirm} onChange={setRegisterConfirm} placeholder="Re-enter your password" autoComplete="new-password" />
            </div>
            <button id="btn-register-submit" type="submit" disabled={loading} className={submitClass}>{loading ? 'Creating account…' : 'Create Account'}</button>
            <p className="text-center text-xs text-[var(--sea-ink-soft)]">
              Already have an account?{' '}
              <button type="button" onClick={() => switchTab('login')} className="font-semibold text-[var(--lagoon-deep)] underline-offset-2 hover:underline">Sign In</button>
            </p>
          </form>
        )}
      </div>
    </main>
  )
}
