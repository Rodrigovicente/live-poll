'use server'

import { ApiResponse } from '@/app/api/utils'
import pool from '@/lib/db/db'
import { createPoll, CreatePollParams } from '@/lib/db/queries/poll'
import { nanoid } from '@/lib/utils'
import pgFormat from 'pg-format'

export async function createNewPoll(
	newPollData: CreatePollParams
): Promise<ApiResponse<any>> {
	console.log(newPollData)

	// Simulate slow network
	// await new Promise(resolve => setTimeout(resolve, 2000))

	if (new Date(newPollData.endsAt) < new Date()) {
		return {
			success: false,
			error: {
				message: 'Invalid voting time limit.',
			},
		}
	}

	if (newPollData.options.length < 2) {
		return {
			success: false,
			error: {
				message: 'Poll must have at least 2 options.',
			},
		}
	}

	if (newPollData.options.length > 100) {
		return {
			success: false,
			error: {
				message: 'Poll must not have more than 100 options.',
			},
		}
	}

	if (newPollData.title.length < 1) {
		return {
			success: false,
			error: {
				message: 'Poll must have a title.',
			},
		}
	}

	const identifier = nanoid(11)

	console.log({
		identifier,
		title: newPollData.title,
		options: newPollData.options,
		description: newPollData.description,
		type: newPollData.type,
		requiredProviders: newPollData.requiredProviders,
		requiredProviderSubs: newPollData.requiredProviderSubs,
		allowNewOptions: newPollData.allowNewOptions,
		endsAt: newPollData.endsAt.toISOString(),
	})

	// check if has repeated options
	if (
		new Set(newPollData.options.map(option => option.optionText)).size !==
		newPollData.options.length
	) {
		return {
			success: false,
			error: {
				message: 'Poll must have unique options.',
			},
		}
	}

	try {
		const queryRes = await createPoll(newPollData)

		if (!queryRes) throw new Error('Failed to create poll.')

		console.log('===>>', queryRes.fields[0])

		if (queryRes.rowCount === 0) {
			return {
				success: false,
				error: {
					message: 'Reached maximum number of open polls.',
				},
			}
		}
	} catch (e) {
		console.error('ERRO:', e)

		return {
			success: false,
			error: {
				message: 'Failed to create poll.',
			},
		}
	}

	return {
		success: true,
		payload: {
			text: 'Poll created successfully.',
		},
	}
}
