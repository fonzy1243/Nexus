import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { getAdminLogs, type LogEntry } from '@/lib/api'

export const Route = createFileRoute('/admin/logs')({ component: AdminLogsPage })

const ACTION_COLORS: Record<string, string> = {
	login_success: 'bg-emerald-500/15 text-emerald-400',
	logout: 'bg-slate-500/15 text-slate-400',
	register: 'bg-blue-500/15 text-blue-400',
	access_denied: 'bg-red-500/15 text-red-400',
	refresh: 'bg-yellow-500/15 text-yellow-400',
	validation_failed: 'bg-orange-500/15 text-orange-400',
}

function actionBadgeClass(action: string) {
	return ACTION_COLORS[action.toLowerCase()] ?? 'bg-purple-500/15 text-purple-400'
}

function formatDate(iso: string) {
	return new Date(iso).toLocaleString(undefined, {
		year: 'numeric', month: 'short', day: 'numeric',
		hour: '2-digit', minute: '2-digit', second: '2-digit',
	})
}

function shortId(id: string) {
	return id.slice(0, 8) + '…'
}

export default function AdminLogsPage() {
	const { user, isLoading: authLoading } = useAuth()
	const navigate = useNavigate()

	const [logs, setLogs] = useState<LogEntry[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [filter, setFilter] = useState('')
	const [page, setPage] = useState(1)
	const PAGE_SIZE = 25

	// Redirect non-admins once auth is resolved
	useEffect(() => {
		if (authLoading) return
		if (!user || user.role !== 'Admin') {
			navigate({ to: '/' })
		}
	}, [user, authLoading, navigate])

	useEffect(() => {
		if (authLoading || !user || user.role !== 'Admin') return
		setLoading(true)
		setError(null)
		getAdminLogs()
			.then(setLogs)
			.catch(err => setError(err instanceof Error ? err.message : 'Failed to load logs'))
			.finally(() => setLoading(false))
	}, [user, authLoading])

	const filtered = logs.filter(l =>
		!filter ||
		l.action.toLowerCase().includes(filter.toLowerCase()) ||
		l.target_type.toLowerCase().includes(filter.toLowerCase()) ||
		l.actor_id.includes(filter) ||
		l.target_id.includes(filter)
	)

	const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
	const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

	if (authLoading) return null

	return (
		<main className="page-wrap px-4 pb-12 pt-6">
			{/* Header */}
			<div className="mb-6 flex flex-wrap items-center justify-between gap-3">
				<div>
					<h1 className="m-0 text-xl font-bold text-[var(--sea-ink)]">
						🛡️ Site Logs
					</h1>
					<p className="mt-1 text-sm text-[var(--sea-ink-soft)]">
						{loading ? 'Loading…' : `${filtered.length.toLocaleString()} entries`}
						{filter && ` matching "${filter}"`}
					</p>
				</div>

				{/* Filter input */}
				<input
					type="search"
					placeholder="Filter by action, type, or ID…"
					value={filter}
					onChange={e => { setFilter(e.target.value); setPage(1) }}
					className="w-full rounded-xl border border-[var(--line)] bg-[var(--input-bg)] px-4 py-2 text-sm text-[var(--sea-ink)] placeholder:text-[var(--sea-ink-soft)] focus:outline-none focus:ring-2 focus:ring-[var(--lagoon)] sm:w-72"
				/>
			</div>

			{/* Error */}
			{error && (
				<div className="island-shell mb-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm text-red-400">
					⚠️ {error}
				</div>
			)}

			{/* Table */}
			<div className="island-shell overflow-hidden rounded-2xl">
				{loading ? (
					<div className="space-y-px p-1">
						{[...Array(8)].map((_, i) => (
							<div
								key={i}
								className="h-12 animate-pulse rounded-xl bg-[var(--chip-bg)]"
								style={{ animationDelay: `${i * 60}ms` }}
							/>
						))}
					</div>
				) : paginated.length === 0 ? (
					<div className="px-6 py-12 text-center text-sm text-[var(--sea-ink-soft)]">
						No log entries found.
					</div>
				) : (
					<div className="overflow-x-auto">
						<table className="w-full min-w-[640px] border-collapse text-sm">
							<thead>
								<tr className="border-b border-[var(--line)] text-left text-xs font-semibold uppercase tracking-wide text-[var(--sea-ink-soft)]">
									<th className="px-4 py-3">Time</th>
									<th className="px-4 py-3">Action</th>
									<th className="px-4 py-3">Actor ID</th>
									<th className="px-4 py-3">Target Type</th>
									<th className="px-4 py-3">Target ID</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-[var(--line)]">
								{paginated.map(log => (
									<tr
										key={log.id}
										className="transition hover:bg-[var(--link-bg-hover)]"
									>
										<td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-[var(--sea-ink-soft)]">
											{formatDate(log.created_at)}
										</td>
										<td className="px-4 py-3">
											<span className={`inline-block rounded-lg px-2.5 py-0.5 text-xs font-semibold ${actionBadgeClass(log.action)}`}>
												{log.action}
											</span>
										</td>
										<td className="px-4 py-3 font-mono text-xs text-[var(--sea-ink-soft)]" title={log.actor_id}>
											{shortId(log.actor_id)}
										</td>
										<td className="px-4 py-3 text-xs text-[var(--sea-ink)]">
											{log.target_type}
										</td>
										<td className="px-4 py-3 font-mono text-xs text-[var(--sea-ink-soft)]" title={log.target_id}>
											{shortId(log.target_id)}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</div>

			{/* Pagination */}
			{!loading && totalPages > 1 && (
				<div className="mt-4 flex items-center justify-center gap-2">
					<button
						type="button"
						onClick={() => setPage(p => Math.max(1, p - 1))}
						disabled={page === 1}
						className="rounded-xl border border-[var(--line)] px-3 py-1.5 text-sm font-semibold text-[var(--sea-ink-soft)] transition hover:bg-[var(--link-bg-hover)] disabled:opacity-30"
					>
						← Prev
					</button>
					<span className="text-sm text-[var(--sea-ink-soft)]">
						Page {page} / {totalPages}
					</span>
					<button
						type="button"
						onClick={() => setPage(p => Math.min(totalPages, p + 1))}
						disabled={page === totalPages}
						className="rounded-xl border border-[var(--line)] px-3 py-1.5 text-sm font-semibold text-[var(--sea-ink-soft)] transition hover:bg-[var(--link-bg-hover)] disabled:opacity-30"
					>
						Next →
					</button>
				</div>
			)}
		</main>
	)
}
