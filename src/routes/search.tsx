import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { search, type SearchResults } from '@/lib/api'

type SearchRouteSearch = { q?: string }

export const Route = createFileRoute('/search')({
  validateSearch: (s: Record<string, unknown>): SearchRouteSearch => ({
    q: typeof s.q === 'string' ? s.q : undefined,
  }),
  component: SearchPage,
})

function SearchPage() {
  const { q } = Route.useSearch()
  const navigate = useNavigate()

  const [inputVal, setInputVal] = useState(q ?? '')
  const [results, setResults] = useState<SearchResults | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setInputVal(q ?? '')
    if (!q || q.trim() === '') { setResults(null); return }
    setLoading(true)
    setError(null)
    search(q)
      .then(setResults)
      .catch(err => setError(err instanceof Error ? err.message : 'Search failed'))
      .finally(() => setLoading(false))
  }, [q])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = inputVal.trim()
    if (!trimmed) return
    navigate({ to: '/search', search: { q: trimmed } })
  }

  const total = (results?.users.length ?? 0) + (results?.posts.length ?? 0)

  return (
    <main className="page-wrap px-4 pb-12 pt-6">
      {/* Search bar */}
      <form onSubmit={handleSubmit} className="mb-6 flex gap-2">
        <input
          type="search"
          value={inputVal}
          onChange={e => setInputVal(e.target.value)}
          placeholder="Search users and posts…"
          autoFocus
          className="flex-1 rounded-xl border border-[var(--line)] bg-[var(--input-bg)] px-4 py-2.5 text-sm text-[var(--sea-ink)] placeholder:text-[var(--sea-ink-soft)] focus:outline-none focus:ring-2 focus:ring-[var(--lagoon)]"
        />
        <button
          type="submit"
          className="rounded-xl bg-[var(--lagoon)] px-5 py-2.5 text-sm font-bold text-white shadow-[0_4px_14px_rgba(79,184,178,0.35)] transition hover:bg-[var(--lagoon-deep)]"
        >
          Search
        </button>
      </form>

      {/* Status line */}
      {q && !loading && results && (
        <p className="mb-4 text-sm text-[var(--sea-ink-soft)]">
          {total === 0
            ? `No results for "${q}"`
            : `${total} result${total !== 1 ? 's' : ''} for "${q}"`}
        </p>
      )}

      {/* Error */}
      {error && (
        <div className="island-shell mb-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm text-red-400">
          ⚠️ {error}
        </div>
      )}

      {/* Skeleton */}
      {loading && (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="island-shell h-16 animate-pulse rounded-2xl"
              style={{ animationDelay: `${i * 60}ms` }}
            />
          ))}
        </div>
      )}

      {/* Results */}
      {!loading && results && (
        <div className="space-y-6">

          {/* Users */}
          {results.users.length > 0 && (
            <section>
              <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-[var(--sea-ink-soft)]">
                Users ({results.users.length})
              </h2>
              <div className="island-shell divide-y divide-[var(--line)] overflow-hidden rounded-2xl">
                {results.users.map(user => (
                  <Link
                    key={user.id}
                    to="/u/$username"
                    params={{ username: user.username }}
                    className="flex items-center gap-3 px-5 py-3.5 no-underline transition hover:bg-[var(--link-bg-hover)]"
                  >
                    <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[var(--lagoon)] text-sm font-bold text-white">
                      {user.username[0].toUpperCase()}
                    </span>
                    <div>
                      <p className="m-0 font-semibold text-[var(--sea-ink)]">
                        u/{user.username}
                      </p>
                      <p className="m-0 text-xs text-[var(--sea-ink-soft)]">
                        Joined {new Date(user.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Posts */}
          {results.posts.length > 0 && (
            <section>
              <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-[var(--sea-ink-soft)]">
                Posts ({results.posts.length})
              </h2>
              <div className="space-y-2">
                {results.posts.map(post => (
                  <Link
                    key={post.id}
                    to="/posts/$postId"
                    params={{ postId: post.id }}
                    className="island-shell block rounded-2xl px-5 py-4 no-underline transition hover:bg-[var(--link-bg-hover)]"
                  >
                    <div className="flex items-start gap-2">
                      {post.is_pinned && (
                        <span className="mt-0.5 flex-shrink-0 text-xs text-[var(--lagoon)]">📌</span>
                      )}
                      <div className="min-w-0">
                        <p className="m-0 font-semibold text-[var(--sea-ink)] line-clamp-1">
                          {post.title}
                        </p>
                        <p className="m-0 mt-1 text-xs text-[var(--sea-ink-soft)] line-clamp-2">
                          {post.body}
                        </p>
                        <p className="m-0 mt-2 text-xs text-[var(--sea-ink-soft)]">
                          by{' '}
                          <span className="font-medium text-[var(--lagoon-deep)]">
                            u/{post.author}
                          </span>
                          {' · '}
                          {new Date(post.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Empty state */}
          {total === 0 && (
            <div className="island-shell rounded-2xl px-6 py-12 text-center">
              <p className="m-0 text-3xl">🔍</p>
              <p className="m-0 mt-3 font-semibold text-[var(--sea-ink)]">No results found</p>
              <p className="m-0 mt-1 text-sm text-[var(--sea-ink-soft)]">
                Try a different search term.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Default empty state (no query yet) */}
      {!q && !loading && (
        <div className="island-shell rounded-2xl px-6 py-16 text-center">
          <p className="m-0 text-4xl">🔍</p>
          <p className="m-0 mt-3 font-semibold text-[var(--sea-ink)]">Search Nexus</p>
          <p className="m-0 mt-1 text-sm text-[var(--sea-ink-soft)]">
            Find users and posts across the community.
          </p>
        </div>
      )}
    </main>
  )
}
