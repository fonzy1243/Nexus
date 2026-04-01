import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import PostCard from '@/components/PostCard'
import type { Post, Community } from '@/lib/api'
import { getCommunity, getCommunityPosts } from '@/lib/api'

export const Route = createFileRoute('/c/$community')({ component: CommunityPage })

function CommunityPage() {
  const { community: communityName } = Route.useParams()
  const [community, setCommunity] = useState<Community | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [joined, setJoined] = useState(false)

  useEffect(() => {
    setLoading(true)
    setNotFound(false)
    Promise.all([
      getCommunity(communityName).catch(() => null),
      getCommunityPosts(communityName).catch(() => [] as Post[]),
    ]).then(([c, p]) => {
      if (!c) setNotFound(true)
      else setCommunity(c)
      setPosts(p)
      setLoading(false)
    })
  }, [communityName])

  if (!loading && notFound) {
    return (
      <main className="page-wrap flex min-h-[calc(100vh-72px)] items-center justify-center px-4 py-14">
        <div className="island-shell rise-in w-full max-w-md rounded-[2rem] px-8 py-10 text-center">
          <div className="mb-4 text-4xl">🌿</div>
          <h1 className="display-title mb-3 text-2xl font-bold text-[var(--sea-ink)]">Community not found</h1>
          <p className="mb-6 text-sm text-[var(--sea-ink-soft)]">n/{communityName} doesn't exist yet.</p>
          <Link to="/create-community" className="inline-flex items-center rounded-full bg-[var(--lagoon)] px-6 py-2.5 text-sm font-semibold text-white no-underline shadow-[0_4px_14px_rgba(79,184,178,0.4)] transition hover:bg-[var(--lagoon-deep)]">
            Create it →
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main>
      {/* Community banner */}
      <div className="border-b border-[var(--line)] bg-[var(--surface)] px-4 py-8">
        <div className="page-wrap">
          {loading ? (
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 animate-pulse rounded-full bg-[var(--line)]" />
              <div className="space-y-2">
                <div className="h-8 w-48 animate-pulse rounded-xl bg-[var(--line)]" />
                <div className="h-4 w-32 animate-pulse rounded-lg bg-[var(--line)]" />
              </div>
            </div>
          ) : community ? (
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-white bg-[var(--lagoon)] text-3xl shadow-lg dark:border-[var(--surface)]">
                {community.logo}
              </div>
              <div className="flex-1">
                <h1 className="m-0 text-2xl font-bold text-[var(--sea-ink)] sm:text-3xl">n/{community.name}</h1>
                <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[var(--sea-ink-soft)]">
                  {typeof community.member_count === 'number' && (
                    <span>{community.member_count.toLocaleString()} members</span>
                  )}
                  {typeof community.post_count === 'number' && (
                    <>
                      <span>·</span>
                      <span>{community.post_count.toLocaleString()} posts</span>
                    </>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setJoined(j => !j)}
                className={`rounded-full px-5 py-2 text-sm font-bold transition ${
                  joined
                    ? 'border border-[var(--lagoon)] text-[var(--lagoon-deep)] hover:border-red-300 hover:text-red-500'
                    : 'bg-[var(--lagoon)] text-white shadow-[0_4px_14px_rgba(79,184,178,0.4)] hover:bg-[var(--lagoon-deep)]'
                }`}
              >
                {joined ? 'Joined ✓' : 'Join'}
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {/* Content */}
      <div className="page-wrap px-4 pb-12 pt-6">
        <div className="flex gap-6">
          <div className="min-w-0 flex-1">

            {/* Create post bar */}
            <div className="island-shell mb-4 flex items-center gap-3 rounded-2xl px-4 py-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--surface-strong)] text-[var(--sea-ink-soft)]">
                👤
              </div>
              <Link
                to="/submit"
                className="flex-1 rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] px-4 py-2 text-sm text-[var(--sea-ink-soft)] no-underline transition hover:border-[var(--lagoon)] hover:text-[var(--sea-ink)]"
              >
                Create a post
              </Link>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="island-shell h-32 animate-pulse rounded-2xl" style={{ animationDelay: `${i * 80}ms` }} />
                ))}
              </div>
            ) : posts.length === 0 ? (
              <div className="island-shell rounded-2xl px-8 py-12 text-center">
                <p className="text-4xl">🌱</p>
                <p className="mt-3 text-base font-semibold text-[var(--sea-ink)]">No posts yet</p>
                <p className="mt-1 text-sm text-[var(--sea-ink-soft)]">Be the first to post in n/{communityName}!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {posts.map(post => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="hidden w-72 flex-shrink-0 lg:block">
            {community && (
              <div className="island-shell rounded-2xl">
                <div className="bg-[var(--lagoon)] px-5 py-3.5">
                  <h3 className="m-0 text-sm font-bold text-white">About n/{community.name}</h3>
                </div>
                <div className="px-5 py-4">
                  <p className="mb-4 text-sm text-[var(--sea-ink-soft)]">
                    A community on Nexus.
                  </p>
                  <div className="mb-4 grid grid-cols-2 gap-3 text-center">
                    <div>
                      <p className="m-0 text-lg font-bold text-[var(--sea-ink)]">{(community.member_count ?? 0).toLocaleString()}</p>
                      <p className="m-0 text-xs text-[var(--sea-ink-soft)]">Members</p>
                    </div>
                    <div>
                      <p className="m-0 text-lg font-bold text-[var(--sea-ink)]">{(community.post_count ?? 0).toLocaleString()}</p>
                      <p className="m-0 text-xs text-[var(--sea-ink-soft)]">Posts</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setJoined(j => !j)}
                    className={`w-full rounded-xl py-2 text-sm font-bold transition ${
                      joined
                        ? 'border border-[var(--lagoon)] text-[var(--lagoon-deep)] hover:border-red-300 hover:text-red-500'
                        : 'bg-[var(--lagoon)] text-white shadow-[0_4px_14px_rgba(79,184,178,0.4)] hover:bg-[var(--lagoon-deep)]'
                    }`}
                  >
                    {joined ? 'Leave community' : 'Join community'}
                  </button>
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </main>
  )
}
