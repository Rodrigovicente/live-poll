'use server'

import { ApiResponse } from '@/app/api/utils'
import pool from '@/lib/db'
import { nanoid } from '@/lib/utils'
import pgFormat from 'pg-format'

export type NewPoll = {
	title: string
	options: {
		optionText: string
	}[]
	description: string
	isMultiple: boolean
	allowNewOptions: boolean
	endsAt: Date
}

export async function createPoll(
	newPollData: NewPoll
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
		isMultiple: newPollData.isMultiple,
		allowNewOptions: newPollData.allowNewOptions,
		endsAt: newPollData.endsAt.toISOString(),
	})

	// check if has repeated options
	const options = newPollData.options.map(option => option.optionText)
	if (new Set(options).size !== options.length) {
		return {
			success: false,
			error: {
				message: 'Poll must have unique options.',
			},
		}
	}

	try {
		const sqlOptionsInsert = pgFormat(
			`
			INSERT INTO "PollOption" (poll_id, index, text) SELECT "poll_id", "index", "text" FROM ((%s) AS "options_data" CROSS JOIN "insert_poll") RETURNING "poll_id";
			`,
			options
				.map(
					(option, index) =>
						(index === 0 ? '' : 'UNION ALL ') +
						pgFormat('SELECT %s AS "index", %L AS "text"', index, option)
				)
				.join(' ')
		)

		console.log('->->', sqlOptionsInsert)

		const queryRes = await pool.query(
			`
				WITH "insert_poll" AS (
					INSERT INTO "Poll" (identifier, title, description, is_multiple, is_closed, allow_new_options, ends_at)
					SELECT $1, $2, $3, $4, $5, $6, $7
					WHERE (SELECT COUNT(*) FROM "Poll" WHERE "is_closed" = false) < 3 RETURNING "id" AS "poll_id"
				)

				${sqlOptionsInsert}
			`,
			[
				identifier,
				newPollData.title,
				newPollData.description,
				newPollData.isMultiple,
				false,
				newPollData.allowNewOptions,
				newPollData.endsAt,
			]
		)

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
