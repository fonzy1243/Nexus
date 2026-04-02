import { useAuth } from "@/lib/auth-context"
import { useIsModerator } from "./useModerator"

export function useCanModerate(communityId: string | undefined) {
	const { user } = useAuth()
	const isMod = useIsModerator(communityId)

	return {
		isMod,
		isAdmin: user?.role === 'Admin',
		canModerate: user?.role === 'Admin' || isMod,
		isOwner: (authorId: string | undefined) => user?.user_id === authorId,
		canEdit: (authorId: string | undefined) => user?.user_id === authorId || user?.role === 'Admin' || isMod,
		canDelete: (authorId: string | undefined) => user?.user_id === authorId || user?.role === 'Admin' || isMod
	}
}
