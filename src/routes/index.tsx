import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import PostCard from '@/components/PostCard'
import type { Post, Community } from '@/lib/api'
import { getPosts, getCommunities } from '@/lib/api'

export const Route = createFileRoute('/')({ component: HomePage })

type SortMode = 'hot' | 'new' | 'top'

function HomePage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [communities, setCommunities] = useState<Community[]>([])
  const [sort, setSort] = useState<SortMode>('hot')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      getPosts().catch(() => [] as Post[]),
      getCommunities().catch(() => [] as Community[]),
    ]).then(([p, c]) => {
      setPosts(p)
      setCommunities(c)
      setLoading(false)
    })
  }, [])

  const sortedPosts = [...posts].sort((a, b) => {
    if (sort === 'new') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    if (sort === 'top') return (b.vote_count ?? 0) - (a.vote_count ?? 0)
    const age = (Date.now() - new Date(a.created_at).getTime()) / 3600000
    const scoreA = (a.vote_count ?? 0) / Math.pow(age + 2, 1.5)
    const ageB = (Date.now() - new Date(b.created_at).getTime()) / 3600000
    const scoreB = (b.vote_count ?? 0) / Math.pow(ageB + 2, 1.5)
    return scoreB - scoreA
  })

  return (
    <main className="page-wrap px-4 pb-12 pt-6">
      <div className="flex gap-6">

        <div className="min-w-0 flex-1">

          <div className="island-shell mb-4 flex items-center gap-2 rounded-2xl px-4 py-2.5">
            {(['hot', 'new', 'top'] as SortMode[]).map(s => (
              <button
                key={s}
                type="button"
                onClick={() => setSort(s)}
                className={`rounded-xl px-4 py-1.5 text-sm font-semibold capitalize transition ${
                  sort === s
                    ? 'bg-[var(--lagoon)] text-white shadow-sm'
                    : 'text-[var(--sea-ink-soft)] hover:bg-[var(--link-bg-hover)] hover:text-[var(--sea-ink)]'
                }`}
              >
                {s === 'hot' ? '🔥' : s === 'new' ? '✨' : '⬆️'} {s}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="island-shell h-32 animate-pulse rounded-2xl" style={{ animationDelay: `${i * 80}ms` }} />
              ))}
            </div>
          ) : sortedPosts.length === 0 ? (
            <div className="island-shell rounded-2xl px-8 py-16 text-center">
              <p className="text-4xl">🌱</p>
              <p className="mt-4 text-base font-semibold text-[var(--sea-ink)]">No posts yet</p>
              <p className="mt-1 text-sm text-[var(--sea-ink-soft)]">Be the first to post something!</p>
              <Link to="/submit" className="mt-5 inline-flex rounded-xl bg-[var(--lagoon)] px-6 py-2.5 text-sm font-semibold text-white no-underline shadow-[0_4px_14px_rgba(79,184,178,0.4)] transition hover:bg-[var(--lagoon-deep)]">
                + Create Post
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedPosts.map(post => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </div>

        <aside className="hidden w-72 flex-shrink-0 lg:block">

          <div className="island-shell mb-4 overflow-hidden rounded-2xl">
            <div className="bg-[var(--lagoon)] px-5 py-4">
              <h3 className="m-0 text-base font-bold text-white">🏠 Home</h3>
            </div>
            <div className="px-5 py-4">
              <p className="mb-4 text-sm text-[var(--sea-ink-soft)]">
                Your front page for League of Legends discussion. Welcome to Nexus.
              </p>
              <Link
                to="/submit"
                className="block w-full rounded-xl bg-[var(--lagoon)] py-2 text-center text-sm font-bold text-white no-underline shadow-[0_4px_14px_rgba(79,184,178,0.4)] transition hover:bg-[var(--lagoon-deep)]"
              >
                + Create Post
              </Link>
            </div>
          </div>

          {/* Top Communities */}
          <div className="island-shell rounded-2xl">
            <div className="border-b border-[var(--line)] px-5 py-3.5">
              <h3 className="m-0 text-sm font-bold text-[var(--sea-ink)]">Top Communities</h3>
            </div>
            {communities.length === 0 ? (
              <p className="px-5 py-4 text-xs text-[var(--sea-ink-soft)]">No communities yet.</p>
            ) : (
              <ul className="divide-y divide-[var(--line)] p-0 m-0 list-none">
                {communities.slice(0, 5).map((c, i) => (
                  <li key={c.id}>
                    <Link
                      to="/c/$community"
                      params={{ community: c.name }}
                      className="flex items-center gap-3 px-5 py-3 no-underline transition hover:bg-[var(--link-bg-hover)]"
                    >
                      <span className="text-base">{c.logo}</span>
                      <div className="min-w-0 flex-1">
                        <p className="m-0 truncate text-sm font-semibold text-[var(--sea-ink)]">n/{c.name}</p>
                        {typeof c.member_count === 'number' && (
                          <p className="m-0 text-xs text-[var(--sea-ink-soft)]">
                            {c.member_count.toLocaleString()} members
                          </p>
                        )}
                      </div>
                      <span className="text-xs text-[var(--sea-ink-soft)]">#{i + 1}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <div className="px-5 py-3.5">
              <Link
                to="/create-community"
                className="block text-center text-sm font-semibold text-[var(--lagoon-deep)] no-underline hover:underline"
              >
                + Create a community
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </main>
  )
}
