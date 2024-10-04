'use server'
import { ApiResponse } from '@/app/api/utils'
import { PollData } from './page'
import { revalidatePath } from 'next/cache'
import { createVote, getPollDataWithVotes } from '@/lib/db/queries/poll'
import PollForm from './components/poll-form'
import { getServerSession, Session } from 'next-auth'
import authOptions from '@/app/api/auth/[...nextauth]/auth-options'
import { redirect } from 'next/navigation'

export async function getPollWithVotes(
	identifier: string,
	userId?: string
): Promise<ApiResponse<PollData>> {
	console.log('getting poll ' + identifier)
	try {
		revalidatePath(`/poll/${identifier}`)
	} catch (e) {
		console.error(e)
	}

	try {
		const queryRes = await getPollDataWithVotes(identifier, userId)

		if (!queryRes) throw new Error('Failed to fetch poll data with votes.')

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
				requireTwitchAccount: queryRes.rows[0].require_twitch_account,
				requireGoogleAccount: queryRes.rows[0].require_google_account,
				requireTwitchSub: queryRes.rows[0].require_twitch_sub,
				timeRemaining: 0,
				createdAt: new Date(queryRes.rows[0].created_at),
				options: queryRes.rows.map(row => ({
					text: row.text,
					voteCount: row.vote_count,
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

export async function votePoll(
	identifier: string,
	data: PollForm
): Promise<ApiResponse<string>> {
	const session: (Session & { userId: string }) | null = await getServerSession(
		authOptions
	)
	const userId = session?.userId

	if (!userId) return redirect('/')

	try {
		let votedOptions

		if (typeof data.votedOptions === 'string')
			votedOptions = Number(data.votedOptions)
		else
			votedOptions = data.votedOptions
				.map((v, i) => (v ? i : null))
				.filter(v => v !== null)

		const queryRes = await createVote(identifier, userId, votedOptions)

		if (!queryRes) throw new Error('Failed to insert vote.')

		if (queryRes.rowCount === 0) {
			return {
				success: false,
				error: {
					message: 'Failed to insert vote.',
				},
			}
		}

		return {
			success: true,
			payload: 'Vote registered successfully.',
		}
	} catch (e) {
		console.error(e)

		return {
			success: false,
			error: {
				message: 'Failed to insert vote.',
			},
		}
	}
}
