import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import type { Post, Comment, PublicUserProfile } from '@/lib/api'
import { getUserByUsername, getUserPosts, getUserComments } from '@/lib/api'
import PostCard from '@/components/PostCard'

export const Route = createFileRoute('/u/$username')({ component: PublicProfile })

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function PublicProfile() {
  const { username } = Route.useParams()
  const [tab, setTab] = useState<'posts' | 'comments'>('posts')
  const [profile, setProfile] = useState<PublicUserProfile | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [posts, setPosts] = useState<Post[]>([])
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [contentLoading, setContentLoading] = useState(false)

  // Load the user profile first
  useEffect(() => {
    setLoading(true)
    getUserByUsername(username)
      .then(p => setProfile(p))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [username])

  // Load tab content once profile is available
  useEffect(() => {
    if (!profile) return
    setContentLoading(true)
    if (tab === 'posts') {
      getUserPosts(profile.id)
        .then(setPosts)
        .catch(() => setPosts([]))
        .finally(() => setContentLoading(false))
    } else {
      getUserComments(profile.id)
        .then(c => setComments(c as unknown as Comment[]))
        .catch(() => setComments([]))
        .finally(() => setContentLoading(false))
    }
  }, [profile, tab])

  if (loading) {
    return (
      <main className="page-wrap px-4 py-10">
        <div className="island-shell h-36 animate-pulse rounded-[2rem]" />
      </main>
    )
  }

  if (notFound) {
    return (
      <main className="page-wrap flex min-h-[calc(100vh-72px)] items-center justify-center px-4 py-14">
        <div className="island-shell rise-in w-full max-w-md rounded-[2rem] px-8 py-10 text-center">
          <div className="mb-4 text-4xl">👻</div>
          <h1 className="display-title mb-3 text-2xl font-bold text-[var(--sea-ink)]">User not found</h1>
          <p className="mb-6 text-sm text-[var(--sea-ink-soft)]">u/{username} doesn't exist on Nexus.</p>
          <Link to="/" className="inline-flex items-center rounded-full bg-[var(--lagoon)] px-6 py-2.5 text-sm font-semibold text-white no-underline transition hover:bg-[var(--lagoon-deep)]">
            ← Back to home
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="page-wrap px-4 py-10">
      {/* Profile Header */}
      <div className="island-shell rise-in relative mb-6 overflow-hidden rounded-[2rem] px-8 py-10">
        <div className="pointer-events-none absolute -left-16 -top-20 h-48 w-48 rounded-full bg-[radial-gradient(circle,rgba(79,184,178,0.22),transparent_66%)]" />

        <div className="relative flex items-center gap-5">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--lagoon)] text-2xl font-bold text-white shadow-[0_4px_14px_rgba(79,184,178,0.4)]">
            {username.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="display-title text-2xl font-bold text-[var(--sea-ink)]">u/{username}</h1>
            {profile && (
              <p className="text-sm text-[var(--sea-ink-soft)]">
                Joined {new Date(profile.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-4 border-b border-[var(--line)] px-2">
        <button
          onClick={() => setTab('posts')}
          className={`pb-3 text-sm font-semibold transition-colors ${tab === 'posts' ? 'border-b-2 border-[var(--lagoon)] text-[var(--sea-ink)]' : 'text-[var(--sea-ink-soft)] hover:text-[var(--sea-ink)]'}`}
        >
          Posts
        </button>
        <button
          onClick={() => setTab('comments')}
          className={`pb-3 text-sm font-semibold transition-colors ${tab === 'comments' ? 'border-b-2 border-[var(--lagoon)] text-[var(--sea-ink)]' : 'text-[var(--sea-ink-soft)] hover:text-[var(--sea-ink)]'}`}
        >
          Comments
        </button>
      </div>

      {/* Content */}
      <div className="island-shell min-h-[300px] rounded-[2rem] px-8 py-8">
        {contentLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => <div key={i} className="h-20 animate-pulse rounded-xl bg-[var(--line)]" style={{ animationDelay: `${i * 80}ms` }} />)}
          </div>
        ) : tab === 'posts' ? (
          posts.length === 0 ? (
            <p className="py-6 text-center text-sm text-[var(--sea-ink-soft)]">u/{username} hasn't posted anything yet.</p>
          ) : (
            <div className="space-y-4">
              {posts.map(post => <PostCard key={post.id} post={post} />)}
            </div>
          )
        ) : (
          comments.length === 0 ? (
            <p className="py-6 text-center text-sm text-[var(--sea-ink-soft)]">u/{username} hasn't commented on anything yet.</p>
          ) : (
            <div className="space-y-4">
              {comments.map((comment: Comment) => (
                <article key={comment.id} className="rounded-2xl border border-[var(--line)] bg-[var(--surface-strong)] p-5 transition hover:border-[var(--lagoon)]">
                  <div className="mb-2 text-xs text-[var(--sea-ink-soft)]">
                    {comment.post_id && (
                      <Link to="/posts/$postId" params={{ postId: comment.post_id }} className="font-semibold text-[var(--sea-ink)] hover:underline no-underline">
                        View post
                      </Link>
                    )}
                    {' '}· {timeAgo(comment.created_at)}
                  </div>
                  <p className="text-sm text-[var(--sea-ink)]">{comment.body}</p>
                </article>
              ))}
            </div>
          )
        )}
      </div>
    </main>
  )
}
