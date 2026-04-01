import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { createPost, getCommunities } from '@/lib/api'
import type { Community } from '@/lib/api'

export const Route = createFileRoute('/create-post')({ component: CreatePostPage })

function CreatePostPage() {
  const navigate = useNavigate()
  const { user, isLoading: authLoading } = useAuth()

  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [communityId, setCommunityId] = useState('')
  const [communities, setCommunities] = useState<Community[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getCommunities()
      .then(setCommunities)
      .catch(() => {/* silently fail, manual ID still works */})
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!title.trim() || !body.trim() || !communityId.trim()) {
      setError('Please fill in all fields.')
      return
    }

    setLoading(true)
    try {
      await createPost({ title, body, community_id: communityId })
      navigate({ to: '/' })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  if (authLoading) return null

  // Not logged in
  if (!user) {
    return (
      <main className="page-wrap flex min-h-[calc(100vh-72px)] items-center justify-center px-4 py-14">
        <div className="island-shell rise-in w-full max-w-md rounded-[2rem] px-8 py-10 text-center">
          <div className="mb-4 text-4xl">🔒</div>
          <h1 className="display-title mb-3 text-2xl font-bold text-[var(--sea-ink)]">
            You need to be signed in to post
          </h1>
          <p className="mb-6 text-sm text-[var(--sea-ink-soft)]">
            Create an account or sign in to start posting on Nexus.
          </p>
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

  return (
    <main className="page-wrap px-4 py-10">
      <div className="island-shell rise-in relative mx-auto w-full max-w-2xl overflow-hidden rounded-[2rem] px-8 py-10">
        <div className="pointer-events-none absolute -left-16 -top-20 h-48 w-48 rounded-full bg-[radial-gradient(circle,rgba(79,184,178,0.18),transparent_66%)]" />
        <div className="pointer-events-none absolute -bottom-16 -right-16 h-48 w-48 rounded-full bg-[radial-gradient(circle,rgba(47,106,74,0.10),transparent_66%)]" />

        <div className="relative">
          <h1 className="display-title mb-1 text-2xl font-bold text-[var(--sea-ink)]">
            Create a Post
          </h1>
          <p className="mb-8 text-sm text-[var(--sea-ink-soft)]">
            Posting as <span className="font-semibold text-[var(--lagoon-deep)]">{user.username}</span>
          </p>

          {error && (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Community selector */}
            <div>
              <label htmlFor="community-id" className="mb-1.5 block text-sm font-semibold text-[var(--sea-ink)]">
                Community
              </label>
              {communities.length > 0 ? (
                <select
                  id="community-id"
                  required
                  value={communityId}
                  onChange={(e) => setCommunityId(e.target.value)}
                  className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] px-4 py-2.5 text-sm text-[var(--sea-ink)] outline-none transition focus:border-[var(--lagoon)] focus:ring-2 focus:ring-[rgba(79,184,178,0.25)]"
                >
                  <option value="">Select a community…</option>
                  {communities.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              ) : (
                <input
                  id="community-id"
                  type="text"
                  required
                  value={communityId}
                  onChange={(e) => setCommunityId(e.target.value)}
                  placeholder="e.g. 123e4567-e89b-12d3-a456-426614174000"
                  className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] px-4 py-2.5 text-sm text-[var(--sea-ink)] placeholder:text-[var(--sea-ink-soft)] outline-none transition focus:border-[var(--lagoon)] focus:ring-2 focus:ring-[rgba(79,184,178,0.25)]"
                />
              )}
            </div>

            <div>
              <label htmlFor="post-title" className="mb-1.5 block text-sm font-semibold text-[var(--sea-ink)]">
                Title
              </label>
              <input
                id="post-title"
                type="text"
                required
                maxLength={300}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Give your post a title"
                className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] px-4 py-2.5 text-sm text-[var(--sea-ink)] placeholder:text-[var(--sea-ink-soft)] outline-none transition focus:border-[var(--lagoon)] focus:ring-2 focus:ring-[rgba(79,184,178,0.25)]"
              />
              <p className="mt-1 text-right text-xs text-[var(--sea-ink-soft)]">{title.length}/300</p>
            </div>

            <div>
              <label htmlFor="post-body" className="mb-1.5 block text-sm font-semibold text-[var(--sea-ink)]">
                Body
              </label>
              <textarea
                id="post-body"
                required
                rows={6}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="What's on your mind?"
                className="w-full resize-none rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] px-4 py-2.5 text-sm text-[var(--sea-ink)] placeholder:text-[var(--sea-ink-soft)] outline-none transition focus:border-[var(--lagoon)] focus:ring-2 focus:ring-[rgba(79,184,178,0.25)]"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="rounded-xl bg-[var(--lagoon)] px-6 py-2.5 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(79,184,178,0.4)] transition hover:-translate-y-0.5 hover:bg-[var(--lagoon-deep)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Posting…' : 'Post'}
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
