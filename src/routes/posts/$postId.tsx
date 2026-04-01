import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import type { Post, Comment } from '@/lib/api'
import { getPost, getComments, createComment, votePost } from '@/lib/api'
import { useAuth } from '@/lib/auth-context.tsx'

export const Route = createFileRoute('/posts/$postId')({ component: PostPage })

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function CommentThread({ comment, depth = 0 }: { comment: Comment; depth?: number }) {
  const [collapsed, setCollapsed] = useState(false)
  const [votes, setVotes] = useState(comment.vote_count)
  const [userVote, setUserVote] = useState<1 | -1 | 0>(0)
  const { user } = useAuth()

  function handleVote(v: 1 | -1) {
    if (!user) return
    if (userVote === v) { setVotes(votes - v); setUserVote(0) }
    else { setVotes(votes - userVote + v); setUserVote(v) }
  }

  return (
    <div className={`flex gap-3 ${depth > 0 ? 'border-l-2 border-[var(--line)] pl-4' : ''}`}>
      <button
        type="button"
        onClick={() => setCollapsed(c => !c)}
        className="mt-1 flex-shrink-0 text-[var(--sea-ink-soft)] opacity-50 hover:opacity-100 transition text-xs"
        title={collapsed ? 'Expand' : 'Collapse'}
      >
        {collapsed ? '[+]' : '[–]'}
      </button>

      <div className="min-w-0 flex-1">
        <div className="mb-1.5 flex items-center gap-2 text-xs">
          <span className={`font-bold ${comment.is_pinned ? 'text-[var(--lagoon-deep)]' : 'text-[var(--sea-ink)]'}`}>
            {comment.is_pinned ? '📌 ' : ''}u/{comment.author}
          </span>
          <span className="text-[var(--sea-ink-soft)]">{timeAgo(comment.created_at)}</span>
          {comment.vote_count > 500 && <span className="rounded-full bg-orange-100 px-1.5 py-0.5 text-[10px] font-bold text-orange-600 dark:bg-orange-900/30 dark:text-orange-400">🔥 Top</span>}
        </div>

        {!collapsed && (
          <>
            <p className="mb-2 text-sm leading-relaxed text-[var(--sea-ink)]">{comment.body}</p>

            <div className="mb-3 flex items-center gap-1 text-xs text-[var(--sea-ink-soft)]">
              <button
                type="button"
                onClick={() => handleVote(1)}
                className={`rounded px-1.5 py-0.5 transition ${userVote === 1 ? 'text-[var(--lagoon)] font-bold' : 'hover:text-[var(--lagoon)]'}`}
              >▲</button>
              <span className={`font-bold tabular-nums ${userVote === 1 ? 'text-[var(--lagoon)]' : userVote === -1 ? 'text-red-400' : ''}`}>
                {votes}
              </span>
              <button
                type="button"
                onClick={() => handleVote(-1)}
                className={`rounded px-1.5 py-0.5 transition ${userVote === -1 ? 'text-red-400 font-bold' : 'hover:text-red-400'}`}
              >▼</button>
              <span className="mx-1">·</span>
              <button type="button" className="rounded px-2 py-0.5 hover:bg-[var(--link-bg-hover)] hover:text-[var(--sea-ink)]">Reply</button>
            </div>

            {comment.replies && comment.replies.length > 0 && (
              <div className="space-y-3">
                {comment.replies.map(reply => (
                  <CommentThread key={reply.id} comment={reply} depth={depth + 1} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function PostPage() {
  const { postId } = Route.useParams()
  const { user } = useAuth()
  const [post, setPost] = useState<Post | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [commentBody, setCommentBody] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [votes, setVotes] = useState(0)
  const [userVote, setUserVote] = useState<1 | -1 | 0>(0)

  useEffect(() => {
    setLoading(true)
    setError(null)
    Promise.all([
      getPost(postId),
      getComments(postId).catch(() => []),
    ]).then(([p, c]) => {
      setPost(p)
      setVotes(p.vote_count)
      setComments(c)
    }).catch(err => {
      setError(err instanceof Error ? err.message : 'Post not found')
    }).finally(() => setLoading(false))
  }, [postId])

  function handleVote(v: 1 | -1) {
    if (!user) return
    if (userVote === v) { setVotes(votes - v); setUserVote(0) }
    else { setVotes(votes - userVote + v); setUserVote(v) }
    votePost(postId, v).catch(console.error)
  }

  async function handleCommentSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!commentBody.trim() || !user) return
    setSubmitting(true)
    try {
      await createComment({ post_id: postId, body: commentBody })
      const fresh = await getComments(postId).catch(() => comments)
      setComments(fresh)
      setCommentBody('')
    } catch (err) {
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <main className="page-wrap px-4 pb-12 pt-6">
        <div className="island-shell h-48 animate-pulse rounded-2xl" />
        <div className="mt-4 space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="island-shell h-20 animate-pulse rounded-2xl" style={{ animationDelay: `${i * 80}ms` }} />
          ))}
        </div>
      </main>
    )
  }

  if (error || !post) {
    return (
      <main className="page-wrap px-4 pb-12 pt-6 text-center text-[var(--sea-ink-soft)]">
        <p className="mt-16 text-lg">{error ?? 'Post not found.'}</p>
        <Link to="/" className="mt-4 block text-[var(--lagoon-deep)] hover:underline">← Back to home</Link>
      </main>
    )
  }

  return (
    <main className="page-wrap px-4 pb-12 pt-6">
      <div className="flex gap-6">
        <div className="min-w-0 flex-1">

          <article className="island-shell mb-4 flex gap-4 rounded-2xl px-5 py-5">
            <div className="flex flex-shrink-0 flex-col items-center gap-1">
              <button
                type="button"
                onClick={() => handleVote(1)}
                className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm transition ${
                  userVote === 1 ? 'bg-[var(--lagoon)] text-white' : 'text-[var(--sea-ink-soft)] hover:bg-[var(--link-bg-hover)] hover:text-[var(--lagoon)]'
                }`}
              >▲</button>
              <span className={`text-sm font-bold tabular-nums ${userVote === 1 ? 'text-[var(--lagoon)]' : userVote === -1 ? 'text-red-400' : 'text-[var(--sea-ink)]'}`}>
                {votes >= 1000 ? `${(votes / 1000).toFixed(1)}k` : votes}
              </span>
              <button
                type="button"
                onClick={() => handleVote(-1)}
                className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm transition ${
                  userVote === -1 ? 'bg-red-400 text-white' : 'text-[var(--sea-ink-soft)] hover:bg-[var(--link-bg-hover)] hover:text-red-400'
                }`}
              >▼</button>
            </div>

            <div className="min-w-0 flex-1">
              <div className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-[var(--sea-ink-soft)]">
                <Link to="/c/$community" params={{ community: post.community_name ?? '' }} className="font-semibold text-[var(--sea-ink)] no-underline hover:underline">
                  n/{post.community_name}
                </Link>
                <span>·</span>
                <span>Posted by u/{post.author}</span>
                <span>·</span>
                <span>{timeAgo(post.created_at)}</span>
                {post.is_pinned && <span className="rounded-full bg-[var(--lagoon)] px-2 py-0.5 text-[10px] font-bold text-white">📌 Pinned</span>}
              </div>

              <h1 className="mb-4 text-xl font-bold leading-snug text-[var(--sea-ink)] sm:text-2xl">{post.title}</h1>
              <div className="prose prose-sm max-w-none text-[var(--sea-ink)]">
                <p className="whitespace-pre-wrap leading-relaxed">{post.body}</p>
              </div>

              <div className="mt-4 flex items-center gap-3 border-t border-[var(--line)] pt-4 text-xs text-[var(--sea-ink-soft)]">
                <span>💬 {comments.length} comment{comments.length !== 1 ? 's' : ''}</span>
                <button type="button" className="rounded-lg px-2.5 py-1.5 transition hover:bg-[var(--link-bg-hover)] hover:text-[var(--sea-ink)]">🔗 Share</button>
              </div>
            </div>
          </article>

          {user ? (
            <div className="island-shell mb-4 rounded-2xl px-5 py-4">
              <p className="mb-3 text-xs text-[var(--sea-ink-soft)]">
                Comment as <span className="font-semibold text-[var(--sea-ink)]">{user.username}</span>
              </p>
              <form onSubmit={handleCommentSubmit}>
                <textarea
                  value={commentBody}
                  onChange={e => setCommentBody(e.target.value)}
                  placeholder="What are your thoughts?"
                  rows={4}
                  className="w-full resize-none rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] px-4 py-3 text-sm text-[var(--sea-ink)] placeholder:text-[var(--sea-ink-soft)] outline-none transition focus:border-[var(--lagoon)] focus:ring-2 focus:ring-[rgba(79,184,178,0.25)]"
                />
                <div className="mt-3 flex justify-end">
                  <button
                    type="submit"
                    disabled={!commentBody.trim() || submitting}
                    className="rounded-xl bg-[var(--lagoon)] px-5 py-2 text-sm font-bold text-white shadow-[0_4px_14px_rgba(79,184,178,0.4)] transition hover:bg-[var(--lagoon-deep)] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Posting…' : 'Comment'}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="island-shell mb-4 rounded-2xl px-5 py-4 text-center">
              <p className="mb-3 text-sm text-[var(--sea-ink-soft)]">Sign in to leave a comment</p>
              <Link
                to="/login"
                className="rounded-xl bg-[var(--lagoon)] px-5 py-2 text-sm font-bold text-white no-underline shadow-[0_4px_14px_rgba(79,184,178,0.4)] transition hover:bg-[var(--lagoon-deep)]"
              >
                Sign In
              </Link>
            </div>
          )}

          <div className="island-shell space-y-4 rounded-2xl px-5 py-5">
            {comments.length === 0 ? (
              <p className="text-center text-sm text-[var(--sea-ink-soft)]">No comments yet. Be the first!</p>
            ) : (
              comments.map(comment => (
                <CommentThread key={comment.id} comment={comment} />
              ))
            )}
          </div>
        </div>

        <aside className="hidden w-64 flex-shrink-0 lg:block">
          <div className="island-shell rounded-2xl">
            <div className="border-b border-[var(--line)] px-5 py-3.5">
              <h3 className="m-0 text-sm font-bold text-[var(--sea-ink)]">n/{post.community_name}</h3>
            </div>
            <div className="px-5 py-4">
              <p className="mb-3 text-sm text-[var(--sea-ink-soft)]">A community for League of Legends discussion.</p>
              <Link
                to="/c/$community"
                params={{ community: post.community_name ?? '' }}
                className="block w-full rounded-xl border border-[var(--lagoon)] py-2 text-center text-sm font-bold text-[var(--lagoon-deep)] no-underline transition hover:bg-[rgba(79,184,178,0.08)]"
              >
                Visit Community
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </main>
  )
}
