import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import PostCard from '@/components/PostCard'
import type { Post, Community, CommunityMember } from '@/lib/api'
import { getCommunity, getCommunityMembers, getCommunityPosts, getMemberStatus, getModeratorStatus, joinCommunity, leaveCommunity, makeModerator, removeModerator } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'

export const Route = createFileRoute('/c/$community')({ component: CommunityPage })

function CommunityPage() {
	const { community: communityName } = Route.useParams()
	const { user } = useAuth()
	const [community, setCommunity] = useState<Community | null>(null)
	const [posts, setPosts] = useState<Post[]>([])
	const [loading, setLoading] = useState(true)
	const [notFound, setNotFound] = useState(false)
	const [joined, setJoined] = useState(false)
	const [isToggling, setIsToggling] = useState(false)
	const [isCurrentUserMod, setIsCurrentUserMod] = useState(false)
	const [tab, setTab] = useState<'posts' | 'members'>('posts')
	const [members, setMembers] = useState<CommunityMember[]>([])
	const [loadingMembers, setLoadingMembers] = useState(false)
	const navigate = useNavigate()

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

	useEffect(() => {
		if (user && community) {
			getMemberStatus(community.id).then(setJoined)
			getModeratorStatus(community.id).then(setIsCurrentUserMod)
		} else {
			setJoined(false)
			setIsCurrentUserMod(false)
		}
	}, [user, community])

	useEffect(() => {
		if (tab === 'members' && community && members.length === 0) {
			setLoadingMembers(true)

			getCommunityMembers(community.id)
				.then(setMembers)
				.catch(err => {
					console.error("Failed to load members", err)
					setMembers([])
				})
				.finally(() => {
					setLoadingMembers(false)
				})
		}
	}, [tab, community, members.length])

	async function handleToggleMod(memberId: string, currentRole: string) {
		if (!community) return

		setMembers(prev => prev.map(m =>
			m.id === memberId ? { ...m, role: currentRole === 'Moderator' ? 'Subscriber' : 'Moderator' }
				: m
		))
		try {
			if (currentRole === 'Moderator') {
				await removeModerator(community.id, memberId)
			} else {
				await makeModerator(community.id, memberId)
			}

			const freshMembers = await getCommunityMembers(community.id)
			setMembers(freshMembers)
		} catch (err) {
			console.error("Failed to change moderator status", err)
			const freshMembers = await getCommunityMembers(community.id)
			setMembers(freshMembers)
		}
	}

	async function handleToggleJoin() {
		if (!user) {
			navigate({ to: '/login' })
			return
		}

		if (!community || isToggling) return


		setIsToggling(true)
		try {
			if (joined) {
				await leaveCommunity(community.id)
				setJoined(false)
				setCommunity(prev => prev ? { ...prev, member_count: (prev.member_count ?? 1) - 1 } : prev)
			} else {
				await joinCommunity(community.id)
				setJoined(true)
				setCommunity(prev => prev ? { ...prev, member_count: (prev.member_count ?? 0) + 1 } : prev)
			}
		} catch (err) {
			console.error("Failed to toggle community membership:", err)
		} finally {
			setIsToggling(false)
		}
	}

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
								onClick={handleToggleJoin}
								className={`rounded-full px-5 py-2 text-sm font-bold transition ${joined
									? 'border border-[var(--lagoon)] text-[var(--lagoon-deep)] hover:border-red-300 hover:text-red-500'
									: 'bg-[var(--lagoon)] text-white shadow-[0_4px_14px_rgba(79,184,178,0.4)] hover:bg-[var(--lagoon-deep)]'
									}`}
							>
								{isToggling ? '...' : joined ? 'Joined ✓' : 'Join'}
							</button>
						</div>
					) : null}
				</div>
			</div>

			{/* Content */}
			<div className="page-wrap px-4 pb-12 pt-6">
				<div className="flex gap-6">

					{/* Main Feed Column */}
					<div className="min-w-0 flex-1">

						{/* Tab selection */}
						<div className="mb-4 flex gap-4 border-b border-[var(--line)] px-2">
							<button
								onClick={() => setTab('posts')}
								className={`pb-3 text-sm font-semibold transition-colors ${tab === 'posts'
									? 'border-b-2 border-[var(--lagoon)] text-[var(--sea-ink)]'
									: 'text-[var(--sea-ink-soft)] hover:text-[var(--sea-ink)]'
									}`}
							>
								Posts
							</button>
							<button
								onClick={() => setTab('members')}
								className={`pb-3 text-sm font-semibold transition-colors ${tab === 'members'
									? 'border-b-2 border-[var(--lagoon)] text-[var(--sea-ink)]'
									: 'text-[var(--sea-ink-soft)] hover:text-[var(--sea-ink)]'
									}`}
							>
								Members
							</button>
						</div>

						{tab === 'posts' ? (
							<>
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
							</>
						) : (
							< div className="island-shell divide-y divide-[var(--line)] overflow-hidden rounded-2xl">
								{/* Member list */}
								{loadingMembers ? (
									<div className="p-8 text-center text-sm text-[var(--sea-ink-soft)]">Loading members...</div>
								) : members.length === 0 ? (
									<div className="p-8 text-center text-sm text-[var(--sea-ink-soft)]">No members found.</div>
								) : (
									members.map(member => (
										<div key={member.id} className="flex items-center justify-between px-5 py-3.5 transition hover:bg-[var(--surface-strong)]">

											{/* Member Info (Clickable Link) */}
											<Link
												to="/u/$username"
												params={{ username: member.username }}
												className="flex items-center gap-3 no-underline hover:opacity-80"
											>
												<span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[var(--lagoon)] text-sm font-bold text-white">
													{member.username[0].toUpperCase()}
												</span>
												<div>
													<p className="m-0 font-semibold text-[var(--sea-ink)] flex items-center gap-2">
														u/{member.username}
														{member.role === 'Moderator' && (
															<span className="rounded bg-[var(--lagoon)]/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--lagoon-deep)]">Mod</span>
														)}
													</p>
													<p className="m-0 text-xs text-[var(--sea-ink-soft)]">
														Joined {new Date(member.joined_at).toLocaleDateString()}
													</p>
												</div>
											</Link>

											{/* Moderator Controls */}
											{isCurrentUserMod && member.username !== user?.username && (
												<button
													onClick={() => handleToggleMod(member.id, member.role)}
													className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${member.role === 'Moderator'
														? 'border border-[var(--line)] text-[var(--sea-ink-soft)] hover:border-red-300 hover:text-red-500'
														: 'bg-[var(--surface-strong)] text-[var(--lagoon-deep)] hover:bg-[var(--lagoon)] hover:text-white'
														}`}
												>
													{member.role === 'Moderator' ? 'Remove Mod' : 'Make Mod'}
												</button>
											)}
										</div>
									))
								)}
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
										onClick={handleToggleJoin}
										className={`w-full rounded-xl py-2 text-sm font-bold transition ${joined
											? 'border border-[var(--lagoon)] text-[var(--lagoon-deep)] hover:border-red-300 hover:text-red-500'
											: 'bg-[var(--lagoon)] text-white shadow-[0_4px_14px_rgba(79,184,178,0.4)] hover:bg-[var(--lagoon-deep)]'
											}`}
									>
										{isToggling ? '...' : joined ? 'Leave community' : 'Join community'}
									</button>
								</div>
							</div>
						)}
					</aside>
				</div>
			</div>
		</main >
	)
}
