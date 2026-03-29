import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { getUserByUsername, getUserComments, getUserPosts, type PublicUserProfile, type Post, type CommentSummary } from '@/lib/api'
import PostCard from '@/components/PostCard'

export const Route = createFileRoute('/u/$username')({
  component: PublicProfile,
})

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

  const [profile, setProfile] = useState<PublicUserProfile | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [tab, setTab] = useState<'posts' | 'comments'>('posts')

  const [posts, setPosts] = useState<Post[]>([])
  const [comments, setComments] = useState<CommentSummary[]>([])
  const [loadingContent, setLoadingContent] = useState(false)

  // Load profile
  useEffect(() => {
    getUserByUsername(username)
      .then(setProfile)
      .catch((err) => setError(err instanceof Error ? err.message : 'User not found'))
  }, [username])

  // Load content
  useEffect(() => {
    if (!profile) return
    setLoadingContent(true)

    if (tab === 'posts') {
      getUserPosts(profile.id)
        .then(setPosts)
        .catch(console.error)
        .finally(() => setLoadingContent(false))
    } else {
      getUserComments(profile.id)
        .then(setComments)
        .catch(console.error)
        .finally(() => setLoadingContent(false))
    }
  }, [profile, tab])

  if (error) {
    return (
      <main className="page-wrap px-4 py-14 text-center">
        <h1 className="text-2xl font-bold text-[var(--sea-ink)]">404</h1>
        <p className="mt-2 text-[var(--sea-ink-soft)]">{error}</p>
      </main>
    )
  }

  if (!profile) {
    return (
      <main className="page-wrap px-4 py-14 text-center">
        <p className="animate-pulse text-[var(--sea-ink-soft)]">Loading u/{username}…</p>
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
            {profile.username.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="display-title text-2xl font-bold text-[var(--sea-ink)]">{profile.username}</h1>
            <p className="text-sm text-[var(--sea-ink-soft)]">
              Nexus member since {new Date(profile.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-4 border-b border-[var(--line)] px-2">
        <button
          onClick={() => setTab('posts')}
          className={`pb-3 text-sm font-semibold transition-colors ${
            tab === 'posts' ? 'border-b-2 border-[var(--lagoon)] text-[var(--sea-ink)]' : 'text-[var(--sea-ink-soft)] hover:text-[var(--sea-ink)]'
          }`}
        >
          Posts
        </button>
        <button
          onClick={() => setTab('comments')}
          className={`pb-3 text-sm font-semibold transition-colors ${
            tab === 'comments' ? 'border-b-2 border-[var(--lagoon)] text-[var(--sea-ink)]' : 'text-[var(--sea-ink-soft)] hover:text-[var(--sea-ink)]'
          }`}
        >
          Comments
        </button>
      </div>

      {/* Content */}
      <div className="space-y-4">
        {loadingContent && <p className="animate-pulse text-sm text-[var(--sea-ink-soft)] px-2">Loading content…</p>}
        
        {!loadingContent && tab === 'posts' && posts.length === 0 && (
          <p className="text-sm text-[var(--sea-ink-soft)] px-2">u/{profile.username} hasn't posted anything yet.</p>
        )}
        
        {!loadingContent && tab === 'posts' && posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}

        {!loadingContent && tab === 'comments' && comments.length === 0 && (
          <p className="text-sm text-[var(--sea-ink-soft)] px-2">u/{profile.username} hasn't commented on anything yet.</p>
        )}

        {!loadingContent && tab === 'comments' && comments.map((comment) => (
          <article key={comment.id} className="island-shell w-full rounded-2xl p-4 transition hover:border-[var(--lagoon)]">
            <div className="mb-2 text-xs text-[var(--sea-ink-soft)]">
              <span className="font-semibold text-[var(--sea-ink)]">{comment.author}</span>
              {' '}commented on{' '}
              <Link to="/posts/$postId" params={{ postId: comment.post_id }} className="font-semibold text-[var(--sea-ink)] hover:underline">
                {comment.post_title}
              </Link>
              {' '}· {timeAgo(comment.created_at)}
            </div>
            <p className="text-sm text-[var(--sea-ink)] break-words">{comment.body}</p>
          </article>
        ))}
      </div>
    </main>
  )
}
