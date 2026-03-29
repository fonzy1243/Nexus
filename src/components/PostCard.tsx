import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import type { Post } from '@/lib/api'
import { useAuth } from '@/lib/auth-context.tsx'

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

interface PostCardProps {
  post: Post
  compact?: boolean
}

export default function PostCard({ post, compact }: PostCardProps) {
  const { user } = useAuth()
  const [votes, setVotes] = useState(post.vote_count)
  const [userVote, setUserVote] = useState<1 | -1 | 0>(0)

  function handleVote(v: 1 | -1) {
    if (!user) return
    if (userVote === v) {
      setVotes(votes - v)
      setUserVote(0)
    } else {
      setVotes(votes - userVote + v)
      setUserVote(v)
    }
    // TODO: call votePost(post.id, v) from api.ts
  }

  return (
    <article className="island-shell flex gap-3 overflow-hidden rounded-2xl px-4 py-3 transition hover:shadow-[0_6px_24px_rgba(23,58,64,0.1)] sm:gap-4 sm:px-5 sm:py-4">
      {/* Vote column */}
      <div className="flex flex-shrink-0 flex-col items-center gap-1 pt-1">
        <button
          type="button"
          onClick={() => handleVote(1)}
          title={user ? 'Upvote' : 'Sign in to vote'}
          className={`flex h-7 w-7 items-center justify-center rounded-lg text-sm transition ${
            userVote === 1
              ? 'bg-[var(--lagoon)] text-white'
              : 'text-[var(--sea-ink-soft)] hover:bg-[var(--link-bg-hover)] hover:text-[var(--lagoon)]'
          }`}
        >
          ▲
        </button>
        <span
          className={`text-xs font-bold tabular-nums ${
            userVote === 1 ? 'text-[var(--lagoon)]' : userVote === -1 ? 'text-red-400' : 'text-[var(--sea-ink)]'
          }`}
        >
          {votes >= 1000 ? `${(votes / 1000).toFixed(1)}k` : votes}
        </span>
        <button
          type="button"
          onClick={() => handleVote(-1)}
          title={user ? 'Downvote' : 'Sign in to vote'}
          className={`flex h-7 w-7 items-center justify-center rounded-lg text-sm transition ${
            userVote === -1
              ? 'bg-red-400 text-white'
              : 'text-[var(--sea-ink-soft)] hover:bg-[var(--link-bg-hover)] hover:text-red-400'
          }`}
        >
          ▼
        </button>
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        {/* Meta row */}
        <div className="mb-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-[var(--sea-ink-soft)]">
          <Link
            to="/c/$community"
            params={{ community: post.community_name }}
            className="font-semibold text-[var(--sea-ink)] no-underline hover:underline"
          >
            n/{post.community_name}
          </Link>
          <span>·</span>
          <Link
            to="/u/$username"
            params={{ username: post.author }}
            className="font-semibold text-[var(--sea-ink)] no-underline hover:underline"
          >
            Posted by u/{post.author}
          </Link>
          <span>·</span>
          <span>{timeAgo(post.created_at)}</span>
          {post.is_pinned && (
            <>
              <span>·</span>
              <span className="rounded-full bg-[var(--lagoon)] px-2 py-0.5 text-[10px] font-bold text-white">
                📌 Pinned
              </span>
            </>
          )}
        </div>

        {/* Title */}
        <Link
          to="/posts/$postId"
          params={{ postId: post.id }}
          className="block text-[var(--sea-ink)] no-underline"
        >
          <h2 className="mb-2 text-base font-semibold leading-snug hover:text-[var(--lagoon-deep)] sm:text-lg">
            {post.title}
          </h2>
        </Link>

        {/* Body preview */}
        {!compact && (
          <p className="mb-3 line-clamp-3 text-sm text-[var(--sea-ink-soft)]">
            {post.body}
          </p>
        )}

        {/* Footer */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--sea-ink-soft)]">
          <Link
            to="/posts/$postId"
            params={{ postId: post.id }}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 no-underline transition hover:bg-[var(--link-bg-hover)] hover:text-[var(--sea-ink)]"
          >
            💬 {post.comment_count} comment{post.comment_count !== 1 ? 's' : ''}
          </Link>
          <button
            type="button"
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 transition hover:bg-[var(--link-bg-hover)] hover:text-[var(--sea-ink)]"
          >
            🔗 Share
          </button>
          <button
            type="button"
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 transition hover:bg-[var(--link-bg-hover)] hover:text-[var(--sea-ink)]"
          >
            🔖 Save
          </button>
        </div>
      </div>
    </article>
  )
}
