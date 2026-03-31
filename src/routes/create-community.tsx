import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useAuth } from '@/lib/auth-context.tsx'
import { createCommunity } from '@/lib/api'

export const Route = createFileRoute('/create-community')({ component: CreateCommunityPage })

const EMOJI_SUGGESTIONS = ['🌊','🔥','🎮','⚔️','🌿','🚀','🎵','💡','🏆','🌙','🐉','🦋','🎯','🌸','⚡']

function CreateCommunityPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [logo, setLogo] = useState('🌊')
  const [customEmoji, setCustomEmoji] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const activeLogo = customEmoji.trim() || logo

  if (!user) {
    return (
      <main className="page-wrap flex min-h-[calc(100vh-72px)] items-center justify-center px-4 py-14">
        <div className="island-shell rise-in w-full max-w-md rounded-[2rem] px-8 py-10 text-center">
          <div className="mb-4 text-4xl">🔒</div>
          <h1 className="display-title mb-3 text-2xl font-bold text-[var(--sea-ink)]">
            Sign in to create a community
          </h1>
          <Link
            to="/login"
            className="inline-flex items-center rounded-full bg-[var(--lagoon)] px-6 py-2.5 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(79,184,178,0.4)] no-underline transition hover:-translate-y-0.5 hover:bg-[var(--lagoon-deep)]"
          >
            Sign In
          </Link>
        </div>
      </main>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setError(null)
    setLoading(true)
    try {
      await createCommunity({ name: name.trim(), logo: activeLogo })
      navigate({ to: '/c/$community', params: { community: name.trim() } })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create community.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="page-wrap px-4 py-10">
      <div className="island-shell rise-in relative mx-auto w-full max-w-xl overflow-hidden rounded-[2rem] px-8 py-10">
        <div className="pointer-events-none absolute -left-16 -top-20 h-48 w-48 rounded-full bg-[radial-gradient(circle,rgba(79,184,178,0.18),transparent_66%)]" />
        <div className="pointer-events-none absolute -bottom-16 -right-16 h-48 w-48 rounded-full bg-[radial-gradient(circle,rgba(47,106,74,0.10),transparent_66%)]" />

        <div className="relative">
          <h1 className="display-title mb-1 text-2xl font-bold text-[var(--sea-ink)]">Create a Community</h1>
          <p className="mb-8 text-sm text-[var(--sea-ink-soft)]">
            Creating as <span className="font-semibold text-[var(--lagoon-deep)]">{user.username}</span>
          </p>

          {error && (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Logo preview */}
            <div className="flex items-center gap-5">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--surface-strong)] text-4xl shadow-inner">
                {activeLogo}
              </div>
              <div className="flex-1">
                <p className="mb-2 text-xs font-semibold text-[var(--sea-ink-soft)] uppercase tracking-wide">Community Logo</p>
                <div className="mb-2 flex flex-wrap gap-1.5">
                  {EMOJI_SUGGESTIONS.map(e => (
                    <button
                      key={e}
                      type="button"
                      onClick={() => { setLogo(e); setCustomEmoji('') }}
                      className={`rounded-lg px-2 py-1 text-lg transition hover:bg-[var(--link-bg-hover)] ${logo === e && !customEmoji ? 'bg-[var(--link-bg-hover)] ring-2 ring-[var(--lagoon)]' : ''}`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={customEmoji}
                  onChange={e => setCustomEmoji(e.target.value)}
                  placeholder="or type an emoji…"
                  maxLength={2}
                  className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] px-3 py-2 text-sm text-[var(--sea-ink)] placeholder:text-[var(--sea-ink-soft)] outline-none transition focus:border-[var(--lagoon)] focus:ring-2 focus:ring-[rgba(79,184,178,0.25)]"
                />
              </div>
            </div>

            {/* Name */}
            <div>
              <label htmlFor="community-name" className="mb-1.5 block text-sm font-semibold text-[var(--sea-ink)]">
                Community Name
              </label>
              <div className="flex items-center rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] focus-within:border-[var(--lagoon)] focus-within:ring-2 focus-within:ring-[rgba(79,184,178,0.25)] transition overflow-hidden">
                <span className="pl-4 text-sm text-[var(--sea-ink-soft)] select-none">n/</span>
                <input
                  id="community-name"
                  type="text"
                  required
                  maxLength={50}
                  value={name}
                  onChange={e => setName(e.target.value.replace(/\s/g, '_'))}
                  placeholder="community_name"
                  className="flex-1 bg-transparent px-2 py-2.5 text-sm text-[var(--sea-ink)] placeholder:text-[var(--sea-ink-soft)] outline-none"
                />
              </div>
              <p className="mt-1 text-xs text-[var(--sea-ink-soft)]">Letters, numbers, and underscores only. {name.length}/50</p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={loading || !name.trim()}
                className="rounded-xl bg-[var(--lagoon)] px-6 py-2.5 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(79,184,178,0.4)] transition hover:-translate-y-0.5 hover:bg-[var(--lagoon-deep)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Creating…' : 'Create Community'}
              </button>
              <Link
                to="/"
                className="rounded-xl border border-[var(--line)] px-6 py-2.5 text-sm font-semibold text-[var(--sea-ink)] no-underline transition hover:bg-[var(--link-bg-hover)]"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </main>
  )
}
