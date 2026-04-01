import { Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import HeaderUser from '../integrations/better-auth/header-user.tsx'
import ThemeToggle from './ThemeToggle'
import { useAuth } from '@/lib/auth-context'

export default function Header() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = query.trim()
    if (!trimmed) return
    navigate({ to: '/search', search: { q: trimmed } })
    setQuery('')
  }

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--line)] bg-[var(--header-bg)] px-4 backdrop-blur-lg">
      <nav className="page-wrap flex flex-wrap items-center gap-x-3 gap-y-2 py-3 sm:py-4">

        {/* Logo */}
        <h2 className="m-0 flex-shrink-0 text-base font-semibold tracking-tight">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full border border-[var(--chip-line)] bg-[var(--chip-bg)] px-3 py-1.5 text-sm text-[var(--sea-ink)] no-underline shadow-[0_8px_24px_rgba(30,90,72,0.08)] sm:px-4 sm:py-2"
          >
            <span className="h-2 w-2 rounded-full bg-[linear-gradient(90deg,#56c6be,#7ed3bf)]" />
            Nexus
          </Link>
        </h2>

        {/* Search bar */}
        <form
          onSubmit={handleSearch}
          className="order-4 flex w-full items-center gap-2 sm:order-2 sm:w-auto sm:flex-1 sm:max-w-sm"
        >
          <div className="relative flex-1">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--sea-ink-soft)]">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
            <input
              type="search"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search users & posts…"
              className="w-full rounded-xl border border-[var(--line)] bg-[var(--input-bg)] py-1.5 pl-8 pr-3 text-sm text-[var(--sea-ink)] placeholder:text-[var(--sea-ink-soft)] focus:outline-none focus:ring-2 focus:ring-[var(--lagoon)]"
            />
          </div>
        </form>

        {/* Right side controls */}
        <div className="ml-auto flex items-center gap-1.5 sm:ml-0 sm:gap-2">
          <HeaderUser />
          <ThemeToggle />
        </div>

        {/* Nav links */}
        <div className="order-3 flex w-full flex-wrap items-center gap-x-4 gap-y-1 pb-1 text-sm font-semibold sm:order-3 sm:w-auto sm:flex-nowrap sm:pb-0">
          <Link
            to="/"
            className="nav-link"
            activeProps={{ className: 'nav-link is-active' }}
          >
            Home
          </Link>
          <Link
            to="/submit"
            className="nav-link"
            activeProps={{ className: 'nav-link is-active' }}
          >
            + Post
          </Link>
          <Link
            to="/create-community"
            className="nav-link"
            activeProps={{ className: 'nav-link is-active' }}
          >
            + Community
          </Link>
          <Link
            to="/about"
            className="nav-link"
            activeProps={{ className: 'nav-link is-active' }}
          >
            About
          </Link>
          {user?.role === 'admin' && (
            <Link
              to="/admin/logs"
              className="nav-link"
              activeProps={{ className: 'nav-link is-active' }}
            >
              🛡️ Logs
            </Link>
          )}
        </div>

      </nav>
    </header>
  )
}
