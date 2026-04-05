import { useEffect } from "react";

export default function Toast({
	message,
	onClose,
	durationMs = 3500,
}: {
	message: string | null
	onClose: () => void
	durationMs?: number
}) {
	useEffect(() => {
		if (!message) return

		const t = window.setTimeout(onClose, durationMs)

		return () => window.clearTimeout(t)
	}, [message, onClose, durationMs])

	if (!message) return null

	return (
		<div className="fixed bottom-4 right-4 z-50 max-w-sm rounded-md border bg-background px-4 py-3 text-sm shadow-lg">
			{message}
		</div>
	)
}
