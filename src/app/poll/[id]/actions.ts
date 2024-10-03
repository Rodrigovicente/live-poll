import { ApiResponse } from '@/app/api/utils'
import { PollData } from './page'
import { revalidatePath } from 'next/cache'
import pool from '@/lib/db'

export const fetchCache = 'force-no-store'

export async function getPoll(
	identifier: string
): Promise<ApiResponse<PollData>> {
	'use server'

	console.log('getting poll ' + identifier)
	try {
		revalidatePath(`/poll/${identifier}`)
	} catch (e) {
		console.error(e)
	}

	try {
		const queryRes = await pool.query(
			`
				SELECT identifier, title, description, is_multiple, allow_new_options, ends_at, is_closed, created_at, index, text
				FROM "Poll" INNER JOIN "PollOption" ON "Poll".id = "PollOption".poll_id WHERE identifier = $1
			`,
			[identifier]
		)

		console.log('===>>', queryRes.rows)

		if (queryRes.rowCount === 0) {
			return {
				success: false,
				error: {
					message: 'Poll not found.',
				},
			}
		}

		return {
			success: true,
			payload: {
				identifier,
				title: queryRes.rows[0].title,
				description: queryRes.rows[0].description,
				isMultiple: queryRes.rows[0].is_multiple,
				isClosed: queryRes.rows[0].is_closed,
				hasVoted: false,
				allowNewOptions: queryRes.rows[0].allow_new_options,
				timeRemaining: 0,
				createdAt: new Date(queryRes.rows[0].created_at),
				options: queryRes.rows.map(row => ({
					text: row.text,
					voteCount: 1,
					isVoted: true,
				})),
			},
		}
	} catch (e) {
		console.error('ERRO:', e)

		return {
			success: false,
			error: {
				message: 'Failed to fetch poll.',
			},
		}
	}
}
