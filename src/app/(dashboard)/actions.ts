import pool from '@/lib/db'
import { PollCardData } from '@/components/poll-card'
import { ApiResponse } from '../api/utils'

export async function getPollCardList(): Promise<
	ApiResponse<PollCardData[] | null>
> {
	'use server'

	// Simulate slow network
	await new Promise(resolve => setTimeout(resolve, 1000))

	try {
		const queryRes = await pool.query(
			`
				SELECT identifier, title, description, is_multiple, ends_at, is_closed, created_at
				FROM "Poll"
			`
		)

		console.log('===>>', queryRes.rows)

		if (queryRes.rowCount === 0) {
			return {
				success: true,
				payload: [],
			}
		}

		return {
			success: true,
			payload: queryRes.rows.map(row => ({
				identifier: row.identifier,
				title: row.title,
				description: row.description,
				isMultiple: row.is_multiple,
				voteCount: 0,
				timeRemaining: 0,
				isClosed: row.is_closed,
				createdAt: row.created_at,
			})),
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
