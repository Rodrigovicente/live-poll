'use server'
import { PollCardData } from '@/components/poll-card'
import { ApiResponse } from '../api/utils'
import { getPollListFromUser, PollData } from '@/lib/db/queries/poll'

export async function getPollCardList(
	userIdentifier: string,
	openFilter: 'open' | 'closed' | 'all' = 'all'
): Promise<ApiResponse<PollData[] | null>> {
	'use server'

	try {
		const PollDataList = await getPollListFromUser(userIdentifier, openFilter)

		if (!PollDataList) throw new Error('Failed to fetch poll list.')

		if (PollDataList.length === 0) {
			return {
				success: true,
				payload: [],
			}
		}

		return {
			success: true,
			payload: PollDataList,
		}
	} catch (e) {
		console.error('ERRO:', e)

		return {
			success: false,
			error: {
				message: 'Failed to fetch poll list.',
			},
		}
	}
}
