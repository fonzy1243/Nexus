import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import type { Community } from '@/lib/api'
import { useAuth } from '@/lib/auth-context.tsx'
import { MOCK_COMMUNITIES, delay } from '@/lib/mock-data'

// swap nalang sa real API pag ready na
async function fetchCommunities(): Promise<Community[]> {
  await delay(150)
  return MOCK_COMMUNITIES
}

export const Route = createFileRoute('/submit')({ component: SubmitPage })

function SubmitPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [communities, setCommunities] = useState<Community[]>([])
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [communityId, setCommunityId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchCommunities().then(c => {
      setCommunities(c)
      if (c.length > 0) setCommunityId(c[0].id)
    })
  }, [])

  if (!user) {
    return (
      <main className="page-wrap px-4 pb-12 pt-6 text-center">
        <div className="island-shell mx-auto mt-16 max-w-md rounded-2xl px-8 py-10">
          <p className="mb-4 text-base font-semibold text-[var(--sea-ink)]">You need to be signed in to post</p>
          <Link to="/login" className="rounded-xl bg-[var(--lagoon)] px-6 py-2.5 text-sm font-bold text-white no-underline shadow-[0_4px_14px_rgba(79,184,178,0.4)] transition hover:bg-[var(--lagoon-deep)]">
            Sign In
          </Link>
        </div>
      </main>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !body.trim() || !communityId) return
    setError(null)
    setLoading(true)
    try {
      // TODO: const post = await createPost({ title, body, community_id: communityId })
      // navigate({ to: '/posts/$postId', params: { postId: post.id } })
      await delay(700)
      navigate({ to: '/' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit post.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="page-wrap px-4 pb-12 pt-6">
      <div className="flex gap-6">
        <div className="min-w-0 flex-1">
          <div className="mb-4 flex items-center gap-3">
            <Link to="/" className="text-sm text-[var(--sea-ink-soft)] no-underline hover:text-[var(--sea-ink)]">← Home</Link>
            <span className="text-[var(--line)]">/</span>
            <h1 className="m-0 text-lg font-bold text-[var(--sea-ink)]">Create a Post</h1>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="island-shell mb-3 rounded-2xl px-5 py-4">
              <label htmlFor="community" className="mb-2 block text-sm font-bold text-[var(--sea-ink)]">
                Choose a community
              </label>
              <select
                id="community"
                value={communityId}
                onChange={e => setCommunityId(e.target.value)}
                className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] px-4 py-2.5 text-sm text-[var(--sea-ink)] outline-none transition focus:border-[var(--lagoon)] focus:ring-2 focus:ring-[rgba(79,184,178,0.25)]"
              >
                {communities.map(c => (
                  <option key={c.id} value={c.id}>{c.logo} n/{c.name}</option>
                ))}
              </select>
            </div>

            <div className="island-shell rounded-2xl px-5 py-4">
              {error && (
                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
                  ⚠️ {error}
                </div>
              )}

              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Title"
                  required
                  maxLength={300}
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] px-4 py-3 text-base font-semibold text-[var(--sea-ink)] placeholder:font-normal placeholder:text-[var(--sea-ink-soft)] outline-none transition focus:border-[var(--lagoon)] focus:ring-2 focus:ring-[rgba(79,184,178,0.25)]"
                />
                <p className="mt-1 text-right text-xs text-[var(--sea-ink-soft)]">{title.length}/300</p>
              </div>

              <div className="mb-4">
                <textarea
                  placeholder="Text (optional but encouraged)"
                  rows={8}
                  value={body}
                  onChange={e => setBody(e.target.value)}
                  className="w-full resize-y rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] px-4 py-3 text-sm text-[var(--sea-ink)] placeholder:text-[var(--sea-ink-soft)] outline-none transition focus:border-[var(--lagoon)] focus:ring-2 focus:ring-[rgba(79,184,178,0.25)]"
                />
              </div>

              <div className="flex justify-end gap-3 border-t border-[var(--line)] pt-4">
                <Link
                  to="/"
                  className="rounded-xl border border-[var(--line)] px-5 py-2 text-sm font-semibold text-[var(--sea-ink)] no-underline transition hover:bg-[var(--link-bg-hover)]"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={loading || !title.trim()}
                  className="rounded-xl bg-[var(--lagoon)] px-6 py-2 text-sm font-bold text-white shadow-[0_4px_14px_rgba(79,184,178,0.4)] transition hover:bg-[var(--lagoon-deep)] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Posting…' : 'Post'}
                </button>
              </div>
            </div>
          </form>
        </div>

        <aside className="hidden w-72 flex-shrink-0 lg:block">
          <div className="island-shell rounded-2xl">
            <div className="bg-[var(--lagoon)] px-5 py-3.5">
              <h3 className="m-0 text-sm font-bold text-white">Posting Guidelines</h3>
            </div>
            <ul className="m-0 list-none divide-y divide-[var(--line)] p-0">
              {[
                ['1. Be respectful', 'Treat others how you want to be treated.'],
                ['2. Stay on topic', 'Keep posts related to League of Legends.'],
                ['3. No spam', 'No low-effort or duplicate content.'],
                ['4. Use flairs', 'Tag your post appropriately when possible.'],
              ].map(([title, desc]) => (
                <li key={title} className="px-5 py-3">
                  <p className="m-0 text-sm font-semibold text-[var(--sea-ink)]">{title}</p>
                  <p className="m-0 mt-0.5 text-xs text-[var(--sea-ink-soft)]">{desc}</p>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </main>
  )
}
