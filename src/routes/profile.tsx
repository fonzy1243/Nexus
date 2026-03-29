import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

export const Route = createFileRoute('/profile')({ component: ProfilePage })

const API_BASE = 'https://nexus-api-poj0.onrender.com'

interface Post {
  id: string
  title: string
  body: string
  community_id: string
  created_at: string
  is_pinned: boolean
}

function ProfilePage() {
  const [username, setUsername] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [hydrated, setHydrated] = useState(false)
  const [posts, setPosts] = useState<Post[]>([])
  const [loadingPosts, setLoadingPosts] = useState(false)
  const [postsError, setPostsError] = useState<string | null>(null)

  // Read localStorage only after mount — SSR doesn't have window
  useEffect(() => {
    const u = localStorage.getItem('username')
    const id = localStorage.getItem('user_id')
    const token = localStorage.getItem('access_token')
    setUsername(u)
    setUserId(id)
    setAccessToken(token)
    setHydrated(true)
  }, [])

  // Fetch posts once we know who's logged in
  useEffect(() => {
    if (!hydrated || !userId || !accessToken) return

    setLoadingPosts(true)
    fetch(`${API_BASE}/users/${userId}/posts`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      credentials: 'include',
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load posts (${res.status})`)
        return res.json()
      })
      .then((data) => setPosts(data))
      .catch((err: unknown) =>
        setPostsError(err instanceof Error ? err.message : 'Could not load posts'),
      )
      .finally(() => setLoadingPosts(false))
  }, [hydrated, userId, accessToken])

  // Still hydrating — show nothing to avoid flash
  if (!hydrated) return null

  // Not logged in
  if (!username || !accessToken) {
    return (
      <main className="page-wrap flex min-h-[calc(100vh-72px)] items-center justify-center px-4 py-14">
        <div className="island-shell rise-in w-full max-w-md rounded-[2rem] px-8 py-10 text-center">
          <div className="mb-4 text-4xl">🔒</div>
          <h1 className="display-title mb-3 text-2xl font-bold text-[var(--sea-ink)]">
            You need to be signed in
          </h1>
          <Link
            to="/login"
            className="inline-flex items-center rounded-full bg-[var(--lagoon)] px-6 py-2.5 text-sm font-semibold text-white no-underline transition hover:-translate-y-0.5 hover:bg-[var(--lagoon-deep)]"
          >
            Sign In
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="page-wrap px-4 py-10">
      {/* Profile card */}
      <div className="island-shell rise-in relative mb-6 overflow-hidden rounded-[2rem] px-8 py-10">
        <div className="pointer-events-none absolute -left-16 -top-20 h-48 w-48 rounded-full bg-[radial-gradient(circle,rgba(79,184,178,0.22),transparent_66%)]" />
        <div className="pointer-events-none absolute -bottom-16 -right-16 h-48 w-48 rounded-full bg-[radial-gradient(circle,rgba(47,106,74,0.12),transparent_66%)]" />

        <div className="relative flex items-center gap-5">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--lagoon)] text-2xl font-bold text-white shadow-[0_4px_14px_rgba(79,184,178,0.4)]">
            {username.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="display-title text-2xl font-bold text-[var(--sea-ink)]">{username}</h1>
            <p className="text-sm text-[var(--sea-ink-soft)]">Nexus member</p>
          </div>
          <Link
            to="/create-post"
            className="ml-auto inline-flex items-center gap-2 rounded-full bg-[var(--lagoon)] px-5 py-2 text-sm font-semibold text-white no-underline shadow-[0_4px_14px_rgba(79,184,178,0.3)] transition hover:-translate-y-0.5 hover:bg-[var(--lagoon-deep)]"
          >
            + Create Post
          </Link>
        </div>
      </div>

      {/* Posts section */}
      <div className="island-shell rounded-[2rem] px-8 py-8">
        <h2 className="mb-5 text-lg font-bold text-[var(--sea-ink)]">Your Posts</h2>

        {loadingPosts && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-xl bg-[var(--surface-strong)]" />
            ))}
          </div>
        )}

        {postsError && (
          <p className="text-sm text-red-500">{postsError}</p>
        )}

        {!loadingPosts && !postsError && posts.length === 0 && (
          <p className="py-6 text-center text-sm text-[var(--sea-ink-soft)]">
            You haven't posted anything yet.
          </p>
        )}

        {!loadingPosts && posts.length > 0 && (
          <div className="space-y-4">
            {posts.map((post) => (
              <article
                key={post.id}
                className="rounded-2xl border border-[var(--line)] bg-[var(--surface-strong)] p-5 transition hover:border-[var(--lagoon)]"
              >
                <div className="mb-1 flex items-start justify-between gap-2">
                  <h3 className="text-base font-semibold text-[var(--sea-ink)]">{post.title}</h3>
                  {post.is_pinned && (
                    <span className="rounded-full bg-[rgba(79,184,178,0.15)] px-2 py-0.5 text-xs font-medium text-[var(--lagoon-deep)]">
                      📌 Pinned
                    </span>
                  )}
                </div>
                <p className="mb-3 line-clamp-2 text-sm text-[var(--sea-ink-soft)]">{post.body}</p>
                <p className="text-xs text-[var(--sea-ink-soft)]">
                  {new Date(post.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
