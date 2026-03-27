import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useSession } from '#/lib/session'

export const Route = createFileRoute('/forum')({
  component: Forum,
})

type RedditPost = {
  id: string
  title: string
  author: string
  subreddit_name_prefixed: string
  url: string
  score: number
  num_comments: number
}

function Forum() {
  const { session } = useSession()
  const [isPending, setIsPending] = useState(true)
  const [posts, setPosts] = useState<RedditPost[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setIsPending(false)
  }, [session])

  useEffect(() => {
    if (!session) return

    let mounted = true

    void (async () => {
      setIsLoading(true)
      setError('')

      try {
        const response = await fetch('/api/reddit')
        if (!response.ok) {
          throw new Error(`Failed to load posts: ${response.status}`)
        }

        const data = await response.json()
        const extracted = (data?.data?.children || []).map((item: any) => ({
          id: item.data.id,
          title: item.data.title,
          author: item.data.author,
          subreddit_name_prefixed: item.data.subreddit_name_prefixed,
          url: `https://reddit.com${item.data.permalink}`,
          score: item.data.score,
          num_comments: item.data.num_comments,
        }))

        if (mounted) {
          setPosts(extracted)
        }
      } catch (err) {
        console.error(err)
        if (mounted) {
          setError('Could not load forum posts. Please try again later.')
        }
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    })()

    return () => {
      mounted = false
    }
  }, [session])

  if (isPending) {
    return (
      <div className="flex items-center justify-center py-10">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-neutral-200 border-t-neutral-900 dark:border-neutral-800 dark:border-t-neutral-100" />
      </div>
    )
  }

  if (!session) {
    return (
      <main className="page-wrap px-4 pb-8 pt-14">
        <section className="island-shell rounded-2xl p-6">
          <h1 className="text-2xl font-bold">Forum access requires sign in</h1>
          <p className="mt-2 text-neutral-600 dark:text-neutral-300">
            Please sign in or sign up first to view discussion posts.
          </p>
          <div className="mt-4 flex gap-3">
            <Link
              to="/demo/better-auth"
              className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium"
            >
              Sign in / Sign up
            </Link>
            <Link
              to="/"
              className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium"
            >
              Back home
            </Link>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="page-wrap px-4 pb-8 pt-14">
      <section className="island-shell rounded-2xl p-6">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">League of Legends Forum</h1>
            <p className="text-sm text-neutral-600 dark:text-neutral-300">
              Showing posts from r/leagueoflegends from Reddit.
            </p>
          </div>
          <div className="text-sm text-neutral-500 dark:text-neutral-400">
            Signed in as <strong>{session.email}</strong>
          </div>
        </div>

        {isLoading && (
          <p className="text-sm text-neutral-500">Loading posts…</p>
        )}

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-900/20 dark:text-red-300">
            {error}
          </div>
        )}

        {!isLoading && !error && posts.length === 0 && (
          <p className="text-sm text-neutral-500">No posts available yet.</p>
        )}

        <ul className="mt-4 space-y-3">
          {posts.map((post) => (
            <li key={post.id} className="rounded-lg border border-[var(--line)] p-4">
              <a
                href={post.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-base font-semibold text-[var(--sea-ink)] hover:underline"
              >
                {post.title}
              </a>
              <div className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                {post.subreddit_name_prefixed} · by {post.author} · {post.score} points · {post.num_comments} comments
              </div>
            </li>
          ))}
        </ul>
      </section>
    </main>
  )
}
