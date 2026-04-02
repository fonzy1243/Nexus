import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { apiFetch } from "@/lib/api"

export function useIsModerator(communityId: string | undefined) {
	const { user } = useAuth()
	const [isMod, setIsMod] = useState(false)

	useEffect(() => {
		if (!user || !communityId) return
		apiFetch<boolean>(`/communities/${communityId}/mod-status`)
			.then(setIsMod)
			.catch(() => setIsMod(false))
	}, [user, communityId])

	return isMod
}
