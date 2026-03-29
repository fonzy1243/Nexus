import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'

export const Route = createFileRoute('/login')({ component: LoginPage })

const API_BASE = 'https://nexus-api-poj0.onrender.com'

type Tab = 'login' | 'register'

function LoginPage() {
  const navigate = useNavigate()
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

  // Password requirement checks (live)
  const pwChecks = {
    length: registerPassword.length >= 8,
    uppercase: /[A-Z]/.test(registerPassword),
    number: /[0-9]/.test(registerPassword),
    special: /[^a-zA-Z0-9]/.test(registerPassword),
  }
  const pwValid = Object.values(pwChecks).every(Boolean)

  function switchTab(t: Tab) {
    setTab(t)
    setError(null)
    setSuccessMsg(null)
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const res = await fetch(`${API_BASE}/users/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // needed for the refresh_token cookie
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message ?? `Login failed (${res.status})`)
      }

      // store access token + basic user info
      localStorage.setItem('access_token', data.access_token)
      localStorage.setItem('user_id', data.user_id)
      localStorage.setItem('username', data.username)

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

    if (!pwValid) {
      setError('Please make sure your password meets all requirements.')
      return
    }
    if (registerPassword !== registerConfirm) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)

    try {
      const res = await fetch(`${API_BASE}/users/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          username: registerName,
          email: registerEmail,
          password: registerPassword,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message ?? `Registration failed (${res.status})`)
      }

      // Registration also returns tokens — log the user straight in
      localStorage.setItem('access_token', data.access_token)
      localStorage.setItem('user_id', data.user_id)
      localStorage.setItem('username', data.username)

      navigate({ to: '/' })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="page-wrap flex min-h-[calc(100vh-72px)] items-center justify-center px-4 py-14">
      <div className="island-shell rise-in relative w-full max-w-md overflow-hidden rounded-[2rem] px-8 py-10">
        <div className="pointer-events-none absolute -left-16 -top-20 h-48 w-48 rounded-full bg-[radial-gradient(circle,rgba(79,184,178,0.28),transparent_66%)]" />
        <div className="pointer-events-none absolute -bottom-16 -right-16 h-48 w-48 rounded-full bg-[radial-gradient(circle,rgba(47,106,74,0.16),transparent_66%)]" />

        <div className="relative mb-8 text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full border border-[var(--chip-line)] bg-[var(--chip-bg)] px-3 py-1.5 text-sm font-semibold text-[var(--sea-ink)] no-underline shadow-[0_8px_24px_rgba(30,90,72,0.08)]"
          >
            <span className="h-2 w-2 rounded-full bg-[linear-gradient(90deg,#56c6be,#7ed3bf)]" />
            Nexus
          </Link>
          <h1 className="display-title mt-5 text-3xl font-bold tracking-tight text-[var(--sea-ink)]">
            {tab === 'login' ? 'Welcome back' : 'Create account'}
          </h1>
          <p className="mt-2 text-sm text-[var(--sea-ink-soft)]">
            {tab === 'login'
              ? 'Sign in to continue to Nexus.'
              : 'Join Nexus today — it only takes a moment.'}
          </p>
        </div>

        <div className="relative mb-8 flex rounded-xl border border-[var(--line)] bg-[var(--surface)] p-1">
          <button
            id="tab-login"
            type="button"
            onClick={() => switchTab('login')}
            className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${
              tab === 'login'
                ? 'bg-[var(--lagoon)] text-white shadow-sm'
                : 'text-[var(--sea-ink-soft)] hover:text-[var(--sea-ink)]'
            }`}
          >
            Sign In
          </button>
          <button
            id="tab-register"
            type="button"
            onClick={() => switchTab('register')}
            className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${
              tab === 'register'
                ? 'bg-[var(--lagoon)] text-white shadow-sm'
                : 'text-[var(--sea-ink-soft)] hover:text-[var(--sea-ink)]'
            }`}
          >
            Register
          </button>
        </div>

        {/* Error / Success banner */}
        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
        {successMsg && (
          <div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {successMsg}
          </div>
        )}

        {tab === 'login' && (
          <form id="form-login" onSubmit={handleLogin} className="space-y-4">
            <div>
              <label
                htmlFor="login-email"
                className="mb-1.5 block text-sm font-semibold text-[var(--sea-ink)]"
              >
                Email
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] px-4 py-2.5 text-sm text-[var(--sea-ink)] placeholder:text-[var(--sea-ink-soft)] outline-none transition focus:border-[var(--lagoon)] focus:ring-2 focus:ring-[rgba(79,184,178,0.25)]"
              />
            </div>

            <div>
              <label
                htmlFor="login-password"
                className="mb-1.5 block text-sm font-semibold text-[var(--sea-ink)]"
              >
                Password
              </label>
              <input
                id="login-password"
                type="password"
                autoComplete="current-password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] px-4 py-2.5 text-sm text-[var(--sea-ink)] placeholder:text-[var(--sea-ink-soft)] outline-none transition focus:border-[var(--lagoon)] focus:ring-2 focus:ring-[rgba(79,184,178,0.25)]"
              />
            </div>

            <div className="flex justify-end">
              <a
                href="#"
                className="text-xs font-medium text-[var(--lagoon-deep)] no-underline hover:underline"
              >
                Forgot password?
              </a>
            </div>

            <button
              id="btn-login-submit"
              type="submit"
              disabled={loading}
              className="mt-2 w-full rounded-xl bg-[var(--lagoon)] py-2.5 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(79,184,178,0.4)] transition hover:-translate-y-0.5 hover:bg-[var(--lagoon-deep)] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>

            <p className="text-center text-xs text-[var(--sea-ink-soft)]">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => switchTab('register')}
                className="font-semibold text-[var(--lagoon-deep)] underline-offset-2 hover:underline"
              >
                Register
              </button>
            </p>
          </form>
        )}

        {tab === 'register' && (
          <form id="form-register" onSubmit={handleRegister} className="space-y-4">
            <div>
              <label
                htmlFor="reg-name"
                className="mb-1.5 block text-sm font-semibold text-[var(--sea-ink)]"
              >
                Username
              </label>
              <input
                id="reg-name"
                type="text"
                autoComplete="username"
                required
                value={registerName}
                onChange={(e) => setRegisterName(e.target.value)}
                placeholder="SummonerName"
                className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] px-4 py-2.5 text-sm text-[var(--sea-ink)] placeholder:text-[var(--sea-ink-soft)] outline-none transition focus:border-[var(--lagoon)] focus:ring-2 focus:ring-[rgba(79,184,178,0.25)]"
              />
            </div>

            <div>
              <label
                htmlFor="reg-email"
                className="mb-1.5 block text-sm font-semibold text-[var(--sea-ink)]"
              >
                Email
              </label>
              <input
                id="reg-email"
                type="email"
                autoComplete="email"
                required
                value={registerEmail}
                onChange={(e) => setRegisterEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] px-4 py-2.5 text-sm text-[var(--sea-ink)] placeholder:text-[var(--sea-ink-soft)] outline-none transition focus:border-[var(--lagoon)] focus:ring-2 focus:ring-[rgba(79,184,178,0.25)]"
              />
            </div>

            <div>
              <label
                htmlFor="reg-password"
                className="mb-1.5 block text-sm font-semibold text-[var(--sea-ink)]"
              >
                Password
              </label>
              <input
                id="reg-password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={registerPassword}
                onChange={(e) => setRegisterPassword(e.target.value)}
                placeholder="Min. 8 chars, 1 uppercase, 1 number, 1 symbol"
                className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] px-4 py-2.5 text-sm text-[var(--sea-ink)] placeholder:text-[var(--sea-ink-soft)] outline-none transition focus:border-[var(--lagoon)] focus:ring-2 focus:ring-[rgba(79,184,178,0.25)]"
              />

              {registerPassword.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {[
                    { key: 'length', label: 'At least 8 characters' },
                    { key: 'uppercase', label: 'At least 1 uppercase letter' },
                    { key: 'number', label: 'At least 1 number' },
                    { key: 'special', label: 'At least 1 special character (!@#$...)' },
                  ].map(({ key, label }) => (
                    <li key={key} className={`flex items-center gap-1.5 text-xs ${pwChecks[key as keyof typeof pwChecks] ? 'text-green-600' : 'text-red-500'}`}>
                      <span>{pwChecks[key as keyof typeof pwChecks] ? '✓' : '✗'}</span>
                      {label}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <label
                htmlFor="reg-confirm"
                className="mb-1.5 block text-sm font-semibold text-[var(--sea-ink)]"
              >
                Confirm Password
              </label>
              <input
                id="reg-confirm"
                type="password"
                autoComplete="new-password"
                required
                value={registerConfirm}
                onChange={(e) => setRegisterConfirm(e.target.value)}
                placeholder="Re-enter your password"
                className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] px-4 py-2.5 text-sm text-[var(--sea-ink)] placeholder:text-[var(--sea-ink-soft)] outline-none transition focus:border-[var(--lagoon)] focus:ring-2 focus:ring-[rgba(79,184,178,0.25)]"
              />
            </div>

            <button
              id="btn-register-submit"
              type="submit"
              disabled={loading}
              className="mt-2 w-full rounded-xl bg-[var(--lagoon)] py-2.5 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(79,184,178,0.4)] transition hover:-translate-y-0.5 hover:bg-[var(--lagoon-deep)] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating account…' : 'Create Account'}
            </button>

            <p className="text-center text-xs text-[var(--sea-ink-soft)]">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => switchTab('login')}
                className="font-semibold text-[var(--lagoon-deep)] underline-offset-2 hover:underline"
              >
                Sign In
              </button>
            </p>
          </form>
        )}
      </div>
    </main>
  )
}
