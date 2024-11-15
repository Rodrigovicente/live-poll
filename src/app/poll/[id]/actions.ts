'use server'
import { ApiResponse } from '@/app/api/utils'
import { PollData } from './page'
import { revalidatePath } from 'next/cache'
import {
	createVote,
	getPollDataWithVotes,
	registerVote,
} from '@/lib/db/queries/poll'
import PollForm from './components/poll-form'
import { getServerSession, Session } from 'next-auth'
import authOptions from '@/app/api/auth/[...nextauth]/auth-options'
import { redirect } from 'next/navigation'
import {
	registerMultipleVotesRow,
	registerSingleVoteRow,
} from '@/db/db/poll_sql'

export async function getPollWithVotes(
	pollIdentifier: string,
	userIdentifier: string = ''
): Promise<ApiResponse<PollData>> {
	console.log('getting poll ' + pollIdentifier)
	try {
		revalidatePath(`/poll/${pollIdentifier}`)
	} catch (e) {
		console.error(e)
	}

	try {
		const pollData = await getPollDataWithVotes(pollIdentifier, userIdentifier)

		if (!pollData) throw new Error('Failed to fetch poll data with votes.')

		if (!pollData) {
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
				identifier: pollIdentifier,
				title: pollData.title,
				description: pollData.description,
				type: pollData.type,
				isClosed: pollData.isClosed,
				hasVoted: pollData.hasVoted,
				hasCreatedOption: pollData.hasCreatedOption,
				allowNewOptions: pollData.allowNewOptions,
				allowVoteEdit: pollData.allowVoteEdit,
				requiredProviders: pollData.requiredProviders,
				requiredProviderSubs: pollData.requiredProviderSubs,
				endsAt: pollData.endsAt,
				createdAt: pollData.createdAt,
				options: pollData.options,
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

export async function votePollSingle(
	pollIdentifier: string,
	optionIndex: number,
	newOption?: {
		label: string
		rating?: never
	}
): Promise<ApiResponse<PollData>> {
	const session: (Session & { identifier: string }) | null =
		await getServerSession(authOptions)
	const userIdentifier = session?.identifier

	if (!userIdentifier) return redirect('/')

	try {
		const voteRow = await registerVote({
			type: 'single',
			data: { pollIdentifier, userIdentifier, optionIndex, newOption },
		})

		if (!voteRow) {
			return {
				success: false,
				error: {
					message: 'Failed to insert vote.',
				},
			}
		}

		const updatedPollData = await getPollWithVotes(
			pollIdentifier,
			userIdentifier
		)

		if (!updatedPollData.success)
			updatedPollData.error.message =
				'Failed to fetch poll data with votes after voting.'

		return updatedPollData
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

export async function votePollMultiple(
	pollIdentifier: string,
	optionIndex: number[],
	newOption?: {
		label: string
		rating?: never
	}
): Promise<ApiResponse<PollData>> {
	const session: (Session & { identifier: string }) | null =
		await getServerSession(authOptions)
	const userIdentifier = session?.identifier

	if (!userIdentifier) return redirect('/')

	try {
		const voteRow = (await registerVote({
			type: 'multiple',
			data: { pollIdentifier, userIdentifier, optionIndex, newOption },
		})) as registerMultipleVotesRow[]

		if (!voteRow) {
			return {
				success: false,
				error: {
					message: 'Failed to insert vote.',
				},
			}
		}

		const updatedPollData = await getPollWithVotes(
			pollIdentifier,
			userIdentifier
		)

		if (!updatedPollData.success)
			updatedPollData.error.message =
				'Failed to fetch poll data with votes after voting.'

		return updatedPollData
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

export async function votePollRate(
	pollIdentifier: string,
	indexRatingPairList: [number, 1 | 2 | 3 | 4 | 5][],
	newOption?: {
		label: string
		rating: 1 | 2 | 3 | 4 | 5
	}
): Promise<ApiResponse<PollData>> {
	const session: (Session & { identifier: string }) | null =
		await getServerSession(authOptions)
	const userIdentifier = session?.identifier

	if (!userIdentifier) return redirect('/')

	try {
		const voteRow = (await registerVote({
			type: 'rate',
			data: {
				pollIdentifier,
				userIdentifier,
				optionIndex: indexRatingPairList,
				newOption,
			},
		})) as registerMultipleVotesRow[]

		if (!voteRow) {
			return {
				success: false,
				error: {
					message: 'Failed to insert ratings.',
				},
			}
		}

		const updatedPollData = await getPollWithVotes(
			pollIdentifier,
			userIdentifier
		)

		if (!updatedPollData.success)
			updatedPollData.error.message =
				'Failed to fetch poll data with ratings after voting.'

		return updatedPollData
	} catch (e) {
		console.error(e)

		return {
			success: false,
			error: {
				message: 'Failed to insert rating.',
			},
		}
	}
}
