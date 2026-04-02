import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import React, { useEffect, useState } from 'react'
import type { Post, Comment } from '@/lib/api'
import { getPost, updatePost, deletePost, getComments, createComment, updateComment, deleteComment, votePost } from '@/lib/api'
import { useAuth } from '@/lib/auth-context.tsx'
import { useCanModerate } from '#/lib/hooks/useCanModerate'

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

function CommentThread({ comment, depth = 0, postId, communityId }: { comment: Comment; depth?: number; postId: string, communityId: string | undefined }) {
	const [collapsed, setCollapsed] = useState(false)
	const [votes, setVotes] = useState(comment.vote_count ?? 0)
	const [userVote, setUserVote] = useState<1 | -1 | 0>(0)
	const [replyOpen, setReplyOpen] = useState(false)
	const [replyBody, setReplyBody] = useState('')
	const [submittingReply, setSubmittingReply] = useState(false)
	const [localReplies, setLocalReplies] = useState<Comment[]>(comment.replies ?? [])
	const { user } = useAuth()
	const { canEdit, canDelete } = useCanModerate(communityId)
	const [editing, setEditing] = useState(false)
	const [editBody, setEditBody] = useState(comment.body)
	const [localBody, setLocalBody] = useState(comment.body)

	async function handleDeleteComment() {
		if (!confirm('Delete this comment?')) return
		try {
			await deleteComment(postId, comment.id)
			setLocalBody('[deleted]')
		} catch (err) {
			alert(err instanceof Error ? err.message : 'Failed to delete')
		}
	}

	async function handleEditSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault()
		try {
			await updateComment(postId, comment.id, { body: editBody })
			setLocalBody(editBody)
			setEditing(false)
		} catch (err) {
			alert(err instanceof Error ? err.message : 'Failed to update')
		}
	}

	function handleVote(v: 1 | -1) {
		if (!user) return
		if (userVote === v) { setVotes(votes - v); setUserVote(0) }
		else { setVotes(votes - userVote + v); setUserVote(v) }
	}

	async function handleReplySubmit(e: React.FormEvent) {
		e.preventDefault()
		if (!replyBody.trim() || !user) return
		setSubmittingReply(true)
		try {
			const newReply = await createComment(postId, { body: replyBody, parent_id: comment.id })
			setLocalReplies(prev => [...prev, newReply])
			setReplyBody('')
			setReplyOpen(false)
		} catch {
			// silently fail
		} finally {
			setSubmittingReply(false)
		}
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
					<Link to="/u/$username" params={{ username: comment.author }} className="font-bold text-[var(--sea-ink)] no-underline hover:underline">
						{comment.is_pinned ? '📌 ' : ''}u/{comment.author}
					</Link>
					<span className="text-[var(--sea-ink-soft)]">{timeAgo(comment.created_at)}</span>
					{(comment.vote_count ?? 0) > 500 && (
						<span className="rounded-full bg-orange-100 px-1.5 py-0.5 text-[10px] font-bold text-orange-600 dark:bg-orange-900/30 dark:text-orange-400">🔥 Top</span>
					)}
				</div>

				{!collapsed && (
					<>
						{editing ? (
							<form onSubmit={handleEditSubmit} className='mb-2'>
								<textarea
									value={editBody}
									onChange={e => setEditBody(e.target.value)}
									rows={3}
									className='w-full resize-none rounded-x1 border border-[var(--line)] bg-[var(--surface-strong)] px-3 py-2 text-sm'
								/>
								<div className='mt-2 flex gap-2'>
									<button type='submit' className='rounded-x1 bg-[vad(--lagoon)] px-4 py-1.5 text-xs font-bold text-white'>
										Save
									</button>
									<button type='button' onClick={() => setEditing(false)} className='rounded-x1 border border-[var(--line)] px-4 py-1.5 text-xs'>
										Cancel
									</button>
								</div>
							</form>
						) : (
							<p className="mb-2 text-sm leading-relaxed text-[var(--sea-ink)]">{localBody}</p>
						)}

						<div className="mb-3 flex items-center gap-1 text-xs text-[var(--sea-ink-soft)]">
							<button type="button" onClick={() => handleVote(1)} className={`rounded px-1.5 py-0.5 transition ${userVote === 1 ? 'text-[var(--lagoon)] font-bold' : 'hover:text-[var(--lagoon)]'}`}>▲</button>
							<span className={`font-bold tabular-nums ${userVote === 1 ? 'text-[var(--lagoon)]' : userVote === -1 ? 'text-red-400' : ''}`}>{votes}</span>
							<button type="button" onClick={() => handleVote(-1)} className={`rounded px-1.5 py-0.5 transition ${userVote === -1 ? 'text-red-400 font-bold' : 'hover:text-red-400'}`}>▼</button>
							<span className="mx-1">·</span>
							{user && (
								<button type="button" onClick={() => setReplyOpen(r => !r)} className="rounded px-2 py-0.5 hover:bg-[var(--link-bg-hover)] hover:text-[var(--sea-ink)]">
									Reply
								</button>
							)}
							{canEdit(comment.author_id) && !editing && (
								<button
									type="button"
									onClick={() => setEditing(true)}
									className="rounded px-2 py-0.5 hover:bg-[var(--link-bg-hover)] hover:text-[var(--sea-ink)]"
								>
									Edit
								</button>
							)}
							{canDelete(comment.author_id) && (
								<button
									type="button"
									onClick={handleDeleteComment}
									className="rounded px-2 py-0.5 text-red-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
								>
									Delete
								</button>
							)}
						</div>

						{replyOpen && user && (
							<form onSubmit={handleReplySubmit} className="mb-3">
								<textarea
									value={replyBody}
									onChange={e => setReplyBody(e.target.value)}
									placeholder="Write a reply…"
									rows={3}
									className="w-full resize-none rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] px-3 py-2 text-sm text-[var(--sea-ink)] placeholder:text-[var(--sea-ink-soft)] outline-none transition focus:border-[var(--lagoon)] focus:ring-2 focus:ring-[rgba(79,184,178,0.25)]"
								/>
								<div className="mt-2 flex gap-2">
									<button type="submit" disabled={!replyBody.trim() || submittingReply} className="rounded-xl bg-[var(--lagoon)] px-4 py-1.5 text-xs font-bold text-white transition hover:bg-[var(--lagoon-deep)] disabled:opacity-50">
										{submittingReply ? 'Posting…' : 'Reply'}
									</button>
									<button type="button" onClick={() => setReplyOpen(false)} className="rounded-xl border border-[var(--line)] px-4 py-1.5 text-xs font-semibold text-[var(--sea-ink)] transition hover:bg-[var(--link-bg-hover)]">
										Cancel
									</button>
								</div>
							</form>
						)}

						{localReplies.length > 0 && (
							<div className="space-y-3">
								{localReplies.map(reply => (
									<CommentThread key={reply.id} comment={reply} depth={depth + 1} postId={postId} communityId={communityId} />
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
	const { canEdit, canDelete } = useCanModerate(post?.community_id)
	const [comments, setComments] = useState<Comment[]>([])
	const [loading, setLoading] = useState(true)
	const [notFound, setNotFound] = useState(false)
	const [commentBody, setCommentBody] = useState('')
	const [submitting, setSubmitting] = useState(false)
	const [votes, setVotes] = useState(0)
	const [userVote, setUserVote] = useState<1 | -1 | 0>(0)
	const [editingPost, setEditingPost] = useState(false)
	const [editTitle, setEditTitle] = useState('')
	const [editBody, setEditBody] = useState('')


	const navigate = useNavigate()

	function startEditPost() {
		setEditTitle(post!.title)
		setEditBody(post!.body)
		setEditingPost(true)
	}

	async function handleEditPostSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault()
		try {
			const updated = await updatePost(postId, { title: editTitle, body: editBody })
			setPost(updated)
			setEditingPost(false)
		} catch (err) {
			alert(err instanceof Error ? err.message : 'Failed to update')
		}
	}

	async function handleDeletePost() {
		if (!confirm('Delete this post?')) return
		try {
			await deletePost(postId)
			navigate({ to: '/' })
		} catch (err) {
			alert(err instanceof Error ? err.message : "Failed to delete post")
		}
	}

	useEffect(() => {
		setLoading(true)
		setNotFound(false)
		Promise.all([
			getPost(postId)
				.then(p => { setPost(p); setVotes(p.vote_count ?? 0) })
				.catch(() => setNotFound(true)),
			getComments(postId).then(setComments).catch(() => { }),
		]).finally(() => setLoading(false))
	}, [postId])

	function handleVote(v: 1 | -1) {
		if (!user) return
		const next = userVote === v ? 0 : v
		setVotes(votes - userVote + next)
		setUserVote(next)
		votePost(postId, v).catch(() => { }) // fire-and-forget (non-breaking)
	}

	async function handleCommentSubmit(e: React.FormEvent) {
		e.preventDefault()
		if (!commentBody.trim() || !user) return
		setSubmitting(true)
		try {
			const newComment = await createComment(postId, { body: commentBody })
			setComments(prev => [newComment, ...prev])
			setCommentBody('')
		} catch {
			// silently fail — user stays in the form
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

	if (notFound || !post) {
		return (
			<main className="page-wrap px-4 pb-12 pt-6 text-center text-[var(--sea-ink-soft)]">
				<p className="mt-16 text-lg">Post not found.</p>
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
							<button type="button" onClick={() => handleVote(1)} className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm transition ${userVote === 1 ? 'bg-[var(--lagoon)] text-white' : 'text-[var(--sea-ink-soft)] hover:bg-[var(--link-bg-hover)] hover:text-[var(--lagoon)]'}`}>▲</button>
							<span className={`text-sm font-bold tabular-nums ${userVote === 1 ? 'text-[var(--lagoon)]' : userVote === -1 ? 'text-red-400' : 'text-[var(--sea-ink)]'}`}>
								{votes >= 1000 ? `${(votes / 1000).toFixed(1)}k` : votes}
							</span>
							<button type="button" onClick={() => handleVote(-1)} className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm transition ${userVote === -1 ? 'bg-red-400 text-white' : 'text-[var(--sea-ink-soft)] hover:bg-[var(--link-bg-hover)] hover:text-red-400'}`}>▼</button>
						</div>

						<div className="min-w-0 flex-1">
							<div className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-[var(--sea-ink-soft)]">
								{post.community_name ? (
									<Link to="/c/$community" params={{ community: post.community_name }} className="font-semibold text-[var(--sea-ink)] no-underline hover:underline">
										n/{post.community_name}
									</Link>
								) : (
									<span className="font-semibold text-[var(--sea-ink)]">Community</span>
								)}
								<span>·</span>
								<Link to="/u/$username" params={{ username: post.author }} className="font-semibold text-[var(--sea-ink)] no-underline hover:underline">
									Posted by u/{post.author}
								</Link>
								<span>·</span>
								<span>{timeAgo(post.created_at)}</span>
								{post.is_pinned && <span className="rounded-full bg-[var(--lagoon)] px-2 py-0.5 text-[10px] font-bold text-white">📌 Pinned</span>}
							</div>

							{editingPost ? (
								<form onSubmit={handleEditPostSubmit} className='space-y-3'>
									<input
										value={editTitle}
										onChange={e => setEditTitle(e.target.value)}
										className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] px-4 py-2 text-base font-semibold text-[var(--sea-ink)] outline-none focus:border-[var(--lagoon)]"
									/>
									<textarea
										value={editBody}
										onChange={e => setEditBody(e.target.value)}
										rows={6}
										className="w-full resize-none rounded-xl border border-[var(--line)] bg-[var(--surface-strong)] px-4 py-2 text-sm text-[var(--sea-ink)] outline-none focus:border-[var(--lagoon)]"
									/>
									<div className='flex gap-2'>
										<button type="submit" className='rounded-x1 bg-[var(--lagoon)] px-4 py-1.5 text-sm font-bold text-white'>Save</button>
										<button type="button" onClick={() => setEditingPost(false)} className='rounded-x1 border border-[var(--line)] bg-[var(--surface-strong)] px-4 py-2 text-sm text-[var(--sea-ink)] outline-none focus:border-[var(--lagoon)]'>Cancel</button>
									</div>
								</form>
							) : (
								<>
									<h1 className="mb-4 text-xl font-bold leading-snug text-[var(--sea-ink)] sm:text-2xl">{post.title}</h1>
									<div className="prose prose-sm max-w-none text-[var(--sea-ink)]">
										<p className="whitespace-pre-wrap leading-relaxed">{post.body}</p>
									</div>
								</>
							)}

							<div className="mt-4 flex items-center gap-3 border-t border-[var(--line)] pt-4 text-xs text-[var(--sea-ink-soft)]">
								<span>💬 {comments.length} comment{comments.length !== 1 ? 's' : ''}</span>
								<button type="button" className="rounded-lg px-2.5 py-1.5 transition hover:bg-[var(--link-bg-hover)] hover:text-[var(--sea-ink)]">🔗 Share</button>

								{/* Edite/Delete only shown to owner, mod, or admin (please double check) */}
								{canEdit(post?.author_id) && !editingPost && (
									<button
										type='button'
										onClick={startEditPost}
										className='rounded-lg px-2.5 py-1.5 transition hover:bg-[var(--link-bg-hover)] hover:test-[var(--sea-ink)]'
									>
										Edit
									</button>
								)}
								{canDelete(post?.author_id) && (
									<button
										type='button'
										onClick={handleDeletePost}
										className='rounded-lg px-2.5 py-1.5 text-red-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20'
									>
										Delete
									</button>
								)}
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
									<button type="submit" disabled={!commentBody.trim() || submitting} className="rounded-xl bg-[var(--lagoon)] px-5 py-2 text-sm font-bold text-white shadow-[0_4px_14px_rgba(79,184,178,0.4)] transition hover:bg-[var(--lagoon-deep)] disabled:opacity-50 disabled:cursor-not-allowed">
										{submitting ? 'Posting…' : 'Comment'}
									</button>
								</div>
							</form>
						</div>
					) : (
						<div className="island-shell mb-4 rounded-2xl px-5 py-4 text-center">
							<p className="mb-3 text-sm text-[var(--sea-ink-soft)]">Sign in to leave a comment</p>
							<Link to="/login" className="rounded-xl bg-[var(--lagoon)] px-5 py-2 text-sm font-bold text-white no-underline shadow-[0_4px_14px_rgba(79,184,178,0.4)] transition hover:bg-[var(--lagoon-deep)]">Sign In</Link>
						</div>
					)}

					<div className="island-shell space-y-4 rounded-2xl px-5 py-5">
						{comments.length === 0 ? (
							<p className="text-center text-sm text-[var(--sea-ink-soft)]">No comments yet. Be the first!</p>
						) : (
							comments.map(comment => (
								<CommentThread key={comment.id} comment={comment} postId={postId} communityId={post?.community_id} />
							))
						)}
					</div>
				</div>

				<aside className="hidden w-64 flex-shrink-0 lg:block">
					<div className="island-shell rounded-2xl">
						<div className="border-b border-[var(--line)] px-5 py-3.5">
							<h3 className="m-0 text-sm font-bold text-[var(--sea-ink)]">
								{post.community_name ? `n/${post.community_name}` : 'Community'}
							</h3>
						</div>
						<div className="px-5 py-4">
							<p className="mb-3 text-sm text-[var(--sea-ink-soft)]">A community on Nexus.</p>
							{post.community_name && (
								<Link
									to="/c/$community"
									params={{ community: post.community_name }}
									className="block w-full rounded-xl border border-[var(--lagoon)] py-2 text-center text-sm font-bold text-[var(--lagoon-deep)] no-underline transition hover:bg-[rgba(79,184,178,0.08)]"
								>
									Visit Community
								</Link>
							)}
						</div>
					</div>
				</aside>
			</div>
		</main>
	)
}
