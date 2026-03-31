import { Link, useNavigate } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@/lib/auth-context'

export default function HeaderUser() {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleLogout() {
    signOut()
    setOpen(false)
    navigate({ to: '/' })
  }

  if (!user?.username) {
    return (
      <Link
        to="/login"
        className="inline-flex h-9 items-center rounded-full border border-[var(--chip-line)] bg-[var(--chip-bg)] px-4 text-sm font-semibold text-[var(--sea-ink)] no-underline transition hover:bg-[var(--lagoon)] hover:text-white"
      >
        Sign In
      </Link>
    )
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-full border border-[var(--chip-line)] bg-[var(--chip-bg)] px-3 py-1.5 text-sm font-semibold text-[var(--sea-ink)] transition hover:border-[var(--lagoon)]"
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--lagoon)] text-xs font-bold text-white">
          {user.username.charAt(0).toUpperCase()}
        </span>
        <span className="max-w-[100px] truncate">{user.username}</span>
        <svg
          className={`h-3 w-3 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-48 rounded-2xl border border-[var(--line)] bg-[var(--header-bg)] p-1.5 shadow-lg">
          <div className="px-3 py-2 text-xs text-[var(--sea-ink-soft)]">
            Signed in as <span className="font-semibold text-[var(--sea-ink)]">{user.username}</span>
          </div>

          <div className="my-1 border-t border-[var(--line)]" />

          <Link
            to="/profile"
            onClick={() => setOpen(false)}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-[var(--sea-ink)] no-underline transition hover:bg-[var(--link-bg-hover)]"
          >
            👤 My Profile
          </Link>
          <Link
            to="/submit"
            onClick={() => setOpen(false)}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-[var(--sea-ink)] no-underline transition hover:bg-[var(--link-bg-hover)]"
          >
            ✏️ Create Post
          </Link>

          <div className="my-1 border-t border-[var(--line)]" />

          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-red-500 transition hover:bg-red-50"
          >
            🚪 Log Out
          </button>
        </div>
      )}
    </div>
  )
}
