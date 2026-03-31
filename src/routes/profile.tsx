import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import {
  getUserPosts,
  getUserComments,
  changeUsername,
  changePassword,
  setSecurityQuestion,
  type Post,
  type CommentSummary,
} from '@/lib/api'
import PostCard from '@/components/PostCard'

export const Route = createFileRoute('/profile')({ component: ProfilePage })

type TabMode = 'posts' | 'comments' | 'communities' | 'settings'

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function ProfilePage() {
  const { user, isLoading, setUser } = useAuth()


  const [tab, setTab] = useState<TabMode>('posts')

  const [posts, setPosts] = useState<Post[]>([])
  const [comments, setComments] = useState<CommentSummary[]>([])
  const [joinedCommunities, setJoinedCommunities] = useState<string[]>([])
  const [loadingContent, setLoadingContent] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  
  // Settings Form States
  const [formMsg, setFormMsg] = useState<{ type: 'error'|'success', text: string } | null>(null)
  const [newUsername, setNewUsername] = useState('')
  const [pwCurrent, setPwCurrent] = useState('')
  const [pwNew, setPwNew] = useState('')
  const [pwConfirm, setPwConfirm] = useState('')
  const [secQuestion, setSecQuestion] = useState<'FirstPet' | 'ChildhoodNickname' | 'FirstCarModel'>('FirstPet')
  const [secAnswer, setSecAnswer] = useState('')
  const [secCurrentPw, setSecCurrentPw] = useState('')

  useEffect(() => {
    if (!user?.user_id) return
    setLoadingContent(true)
    setErrorMsg(null)

    if (tab === 'posts') {
      getUserPosts(user.user_id)
        .then(setPosts)
        .catch(() => setPosts([]))
        .finally(() => setLoadingContent(false))
    } else if (tab === 'comments') {
      getUserComments(user.user_id)
        .then(setComments)
        .catch(() => setComments([]))
        .finally(() => setLoadingContent(false))
    } else if (tab === 'communities') {
      // Communities the user has interacted with — derived from posts
      getUserPosts(user.user_id)
        .then(p => {
          const seen = new Set<string>()
          const names: string[] = []
          for (const post of p) {
            if (post.community_name && !seen.has(post.community_name)) {
              seen.add(post.community_name)
              names.push(post.community_name)
            }
          }
          setJoinedCommunities(names)
        })
        .catch(() => setJoinedCommunities([]))
        .finally(() => setLoadingContent(false))
    } else {
      setLoadingContent(false)
      setFormMsg(null)
    }
  }, [user?.user_id, tab])

  async function handleUpdateUsername(e: React.FormEvent) {
    e.preventDefault()
    setFormMsg(null)
    try {
      await changeUsername(newUsername)
      // update local
      localStorage.setItem('username', newUsername)
      setUser({ user_id: user!.user_id, username: newUsername })
      setFormMsg({ type: 'success', text: 'Username updated successfully.' })
      setNewUsername('')
    } catch (err: any) {
      setFormMsg({ type: 'error', text: err.message || 'Failed to update username' })
    }
  }

  async function handleUpdatePassword(e: React.FormEvent) {
    e.preventDefault()
    setFormMsg(null)
    if (pwNew !== pwConfirm) {
      setFormMsg({ type: 'error', text: 'Passwords do not match.' })
      return
    }
    try {
      await changePassword(pwCurrent, pwNew, pwConfirm)
      setFormMsg({ type: 'success', text: 'Password updated successfully.' })
      setPwCurrent('')
      setPwNew('')
      setPwConfirm('')
    } catch (err: any) {
      setFormMsg({ type: 'error', text: err.message || 'Failed to update password' })
    }
  }

  async function handleUpdateSecurity(e: React.FormEvent) {
    e.preventDefault()
    setFormMsg(null)
    try {
      await setSecurityQuestion(secQuestion, secAnswer, secCurrentPw)
      setFormMsg({ type: 'success', text: 'Security question saved successfully.' })
      setSecAnswer('')
      setSecCurrentPw('')
    } catch (err: any) {
      setFormMsg({ type: 'error', text: err.message || 'Failed to save security question' })
    }
  }

  if (isLoading) return null

  if (!user) {
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
            {user.username.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="display-title text-2xl font-bold text-[var(--sea-ink)]">{user.username}</h1>
            <p className="text-sm text-[var(--sea-ink-soft)]">My Dashboard</p>
          </div>
          <Link
            to="/submit"
            className="ml-auto inline-flex items-center gap-2 rounded-full bg-[var(--lagoon)] px-5 py-2 text-sm font-semibold text-white no-underline shadow-[0_4px_14px_rgba(79,184,178,0.3)] transition hover:-translate-y-0.5 hover:bg-[var(--lagoon-deep)]"
          >
            + Create Post
          </Link>
        </div>
      </div>

      <div className="mb-6 flex gap-4 border-b border-[var(--line)] px-2">
        {(['posts', 'comments', 'communities', 'settings'] as TabMode[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`pb-3 text-sm font-semibold capitalize transition-colors ${
              tab === t ? 'border-b-2 border-[var(--lagoon)] text-[var(--sea-ink)]' : 'text-[var(--sea-ink-soft)] hover:text-[var(--sea-ink)]'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="island-shell min-h-[400px] rounded-[2rem] px-8 py-8">
        {loadingContent && <p className="animate-pulse text-sm text-[var(--sea-ink-soft)]">Loading…</p>}
        {errorMsg && <p className="text-sm text-red-500">{errorMsg}</p>}

        {/* POSTS TAB */}
        {!loadingContent && tab === 'posts' && (
          <div className="space-y-4">
            {posts.length === 0 ? (
              <p className="py-6 text-center text-sm text-[var(--sea-ink-soft)]">You haven't posted anything yet.</p>
            ) : (
              posts.map((post) => <PostCard key={post.id} post={post} />)
            )}
          </div>
        )}

        {/* COMMENTS TAB */}
        {!loadingContent && tab === 'comments' && (
          <div className="space-y-4">
            {comments.length === 0 ? (
              <p className="py-6 text-center text-sm text-[var(--sea-ink-soft)]">You haven't commented on anything yet.</p>
            ) : (
              comments.map((comment) => (
                <article key={comment.id} className="rounded-2xl border border-[var(--line)] bg-[var(--surface-strong)] p-5 transition hover:border-[var(--lagoon)]">
                  <div className="mb-2 text-xs text-[var(--sea-ink-soft)]">
                    You commented on{' '}
                    <Link to="/posts/$postId" params={{ postId: comment.post_id }} className="font-semibold text-[var(--sea-ink)] hover:underline">
                      {comment.post_title || 'a post'}
                    </Link>
                    {' '}· {timeAgo(comment.created_at)}
                  </div>
                  <p className="text-sm text-[var(--sea-ink)]">{comment.body}</p>
                </article>
              ))
            )}
          </div>
        )}

        {/* COMMUNITIES TAB */}
        {!loadingContent && tab === 'communities' && (
          <div className="space-y-3">
            {joinedCommunities.length === 0 ? (
              <p className="py-6 text-center text-sm text-[var(--sea-ink-soft)]">You haven't interacted with any communities yet.</p>
            ) : (
              joinedCommunities.map((name) => (
                <Link
                  key={name}
                  to="/c/$community"
                  params={{ community: name }}
                  className="flex items-center gap-3 rounded-2xl border border-[var(--line)] px-5 py-4 no-underline transition hover:border-[var(--lagoon)] hover:bg-[var(--link-bg-hover)]"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--lagoon)] text-lg font-bold text-white">
                    {name.charAt(0).toUpperCase()}
                  </span>
                  <div>
                    <p className="m-0 font-semibold text-[var(--sea-ink)]">n/{name}</p>
                  </div>
                </Link>
              ))
            )}
          </div>
        )}

        {/* SETTINGS TAB */}
        {!loadingContent && tab === 'settings' && (
          <div className="mx-auto max-w-lg space-y-10">
            {formMsg && (
              <div className={`rounded-xl px-4 py-3 text-sm font-medium ${formMsg.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>
                {formMsg.text}
              </div>
            )}

            {/* Change Username section */}
            <section>
              <h3 className="mb-4 text-base font-bold text-[var(--sea-ink)] border-b border-[var(--line)] pb-2">Change Username</h3>
              <form onSubmit={handleUpdateUsername} className="space-y-3">
                <input
                  type="text"
                  required
                  placeholder="New Username"
                  value={newUsername}
                  onChange={e => setNewUsername(e.target.value)}
                  className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] px-4 py-2.5 text-sm outline-none transition focus:border-[var(--lagoon)]"
                />
                <button type="submit" className="rounded-xl bg-[var(--surface-strong)] px-4 py-2 text-sm font-semibold text-[var(--sea-ink)] border border-[var(--line)] hover:bg-[var(--chip-bg)]">
                  Update Username
                </button>
              </form>
            </section>

            {/* Change Password section */}
            <section>
              <h3 className="mb-4 text-base font-bold text-[var(--sea-ink)] border-b border-[var(--line)] pb-2">Change Password</h3>
              <form onSubmit={handleUpdatePassword} className="space-y-3">
                <input
                  type="password"
                  required
                  placeholder="Current Password"
                  value={pwCurrent}
                  onChange={e => setPwCurrent(e.target.value)}
                  className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] px-4 py-2.5 text-sm outline-none transition focus:border-[var(--lagoon)]"
                />
                <input
                  type="password"
                  required
                  placeholder="New Password"
                  value={pwNew}
                  onChange={e => setPwNew(e.target.value)}
                  className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] px-4 py-2.5 text-sm outline-none transition focus:border-[var(--lagoon)]"
                />
                <input
                  type="password"
                  required
                  placeholder="Confirm New Password"
                  value={pwConfirm}
                  onChange={e => setPwConfirm(e.target.value)}
                  className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] px-4 py-2.5 text-sm outline-none transition focus:border-[var(--lagoon)]"
                />
                <button type="submit" className="rounded-xl bg-[var(--surface-strong)] px-4 py-2 text-sm font-semibold text-[var(--sea-ink)] border border-[var(--line)] hover:bg-[var(--chip-bg)]">
                  Update Password
                </button>
              </form>
            </section>

            {/* Recovery Question section */}
            <section>
              <h3 className="mb-4 text-base font-bold text-[var(--sea-ink)] border-b border-[var(--line)] pb-2">Account Recovery</h3>
              <p className="mb-4 text-xs text-[var(--sea-ink-soft)]">Set up a security question to recover your account if you forget your password.</p>
              <form onSubmit={handleUpdateSecurity} className="space-y-3">
                <select
                  value={secQuestion}
                  onChange={e => setSecQuestion(e.target.value as any)}
                  className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] px-4 py-2.5 text-sm outline-none transition focus:border-[var(--lagoon)]"
                >
                  <option value="FirstPet">What was the name of your first pet?</option>
                  <option value="ChildhoodNickname">What was your childhood nickname?</option>
                  <option value="FirstCarModel">What was the model of your first car?</option>
                </select>
                <input
                  type="text"
                  required
                  placeholder="Your Answer"
                  value={secAnswer}
                  onChange={e => setSecAnswer(e.target.value)}
                  className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] px-4 py-2.5 text-sm outline-none transition focus:border-[var(--lagoon)]"
                />
                <input
                  type="password"
                  required
                  placeholder="Current Password (required to save)"
                  value={secCurrentPw}
                  onChange={e => setSecCurrentPw(e.target.value)}
                  className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] px-4 py-2.5 text-sm outline-none transition focus:border-[var(--lagoon)]"
                />
                <button type="submit" className="rounded-xl bg-[var(--surface-strong)] px-4 py-2 text-sm font-semibold text-[var(--sea-ink)] border border-[var(--line)] hover:bg-[var(--chip-bg)]">
                  Save Security Question
                </button>
              </form>
            </section>

          </div>
        )}
      </div>
    </main>
  )
}

