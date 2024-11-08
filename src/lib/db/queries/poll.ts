'use server'

import pgFormat from 'pg-format'
import { QueryResult } from 'pg'
import pool from '../db'
import { nanoid } from '@/lib/utils'
import {
	getPollDataListFromUserByIdentifier,
	getPollDataWithVotes as getPollDataWithVotesSQL,
	registerMultipleVotes,
	registerNewOption,
	registerSingleVote,
} from '@/db/db/poll_sql'
import { getPollDataListFromUserByIdentifierRow } from './../../../db/db/poll_sql'
// import { PollData } from './../../../app/poll/[id]/page'

export type CreatePollParams = {
	creatorUserIdentifier: string
	title: string
	description: string
	options: {
		optionText: string
	}[]
	type: 'single' | 'multiple' | 'rate'
	allowNewOptions: boolean
	allowVoteEdit: boolean
	requiredProviders: string[]
	requiredProviderSubs: string[]
	endsAt: Date
}

export async function createPoll(newPollData: CreatePollParams) {
	'use server'

	const identifier = nanoid(11)

	const options = newPollData.options.map(option => option.optionText)
	if (new Set(options).size !== options.length) {
		return null
	}

	try {
		const sqlOptionsInsert = pgFormat(
			`
			INSERT INTO "PollOption" (poll_id, index, label) SELECT "poll_id", "index", "label" FROM ((%s) AS "options_data" CROSS JOIN "insert_poll") RETURNING "poll_id";
			`,
			options
				.map(
					(option, index) =>
						(index === 0 ? '' : 'UNION ALL ') +
						pgFormat('SELECT %s AS "index", %L AS "label"', index, option)
				)
				.join(' ')
		)

		console.log('->->', sqlOptionsInsert)

		const queryRes = await pool.query(
			`
				WITH "insert_poll" AS (
					WITH "Creator_id_row" AS (
						SELECT id FROM "User" WHERE identifier = $2
					)
					INSERT INTO "Poll" (identifier, creator_user_id, title, description, type, allow_new_options, allow_vote_edit, required_providers, required_provider_subs, ends_at)
					SELECT $1, (SELECT id FROM "Creator_id_row"), $3, $4, $5, $6, $7, $8, $9, $10
					WHERE (SELECT COUNT(*) FROM "Poll" WHERE "is_closed" = false AND creator_user_id = (SELECT id FROM "Creator_id_row")) < 10 RETURNING "id" AS "poll_id"
				)

				${sqlOptionsInsert}
			`,
			[
				identifier,
				newPollData.creatorUserIdentifier,
				newPollData.title,
				newPollData.description,
				newPollData.type,
				newPollData.allowNewOptions,
				newPollData.allowVoteEdit,
				newPollData.requiredProviders,
				newPollData.requiredProviderSubs,
				newPollData.endsAt.toISOString(),
			]
		)

		console.log('createPoll =>', queryRes.rows)

		return queryRes
	} catch (e) {
		console.error('ERROR DURING POLL CREATION:', e)

		return null
	}
}

export type GetPollListRow = {
	identifier: string
	title: string
	description: string
	is_multiple: boolean
	allow_new_options: boolean
	require_twitch_account: boolean
	require_google_account: boolean
	is_closed: boolean
	ends_at: Date
	created_at: Date
}
export type PollData = getPollDataListFromUserByIdentifierRow

export async function getPollListFromUser(userIdentifier: string) {
	'use server'

	const client = await pool.connect()
	try {
		const pollDataList = await getPollDataListFromUserByIdentifier(client, {
			identifier: userIdentifier,
		})

		console.log('getPollListFromUser =>', pollDataList)

		return pollDataList
	} catch (e) {
		console.error(e)

		return null
	} finally {
		client.release()
	}
}

export type GetPollDataWithVotesRow = {
	identifier: string
	title: string
	description: string
	is_multiple: boolean
	allow_new_options: boolean
	require_twitch_account: boolean
	require_google_account: boolean
	require_twitch_sub: boolean
	ends_at: Date
	is_closed: boolean
	created_at: Date
	index: number
	text: string
	vote_count: number
}
export async function getPollDataWithVotes(
	identifier: string,
	userIdentifier: string
) {
	'use server'

	const client = await pool.connect()
	try {
		const pollData = await getPollDataWithVotesSQL(client, {
			identifier,
			userIdentifier,
		})

		console.log('getPollDataWithVotes =>', pollData)

		return {
			identifier: pollData[0].identifier,
			title: pollData[0].title,
			description: pollData[0].description,
			type: pollData[0].type,
			allowNewOptions: pollData[0].allowNewOptions,
			allowVoteEdit: pollData[0].allowVoteEdit,
			requiredProviders: pollData[0].requiredProviders,
			requiredProviderSubs: pollData[0].requiredProviderSubs,
			endsAt: pollData[0].endsAt,
			isClosed: pollData[0].isClosed,
			createdAt: pollData[0].createdAt,
			hasCreatedOption: pollData[0].hasCreated,
			hasVoted: pollData.some(row => row.isVoted),
			options: pollData.map(row => {
				return {
					index: +row.index,
					label: row.label ?? '',
					voteRateCount: +row.voteRateCount,
					rateAvg: row.rateAvg,
					isVoted: row.isVoted,
				}
			}),
		}
	} catch (e) {
		console.error(e)

		return null
	} finally {
		client.release()
	}
}

export type CreateVoteRow = {
	user_id: string
	poll_id: string
	option_index: number
}
export async function createVote(
	identifier: string,
	userIdentifier: string,
	votedIndex: number[] | number
) {
	'use server'

	try {
		let sqlVotedInsert

		if (typeof votedIndex === 'number') {
			sqlVotedInsert = pgFormat(
				`
				WITH "poll_id" AS (
					SELECT "id" FROM "Poll" WHERE "identifier" = %L
				)

				INSERT INTO "Vote" (user_id, poll_id, option_index)
				SELECT "user_id", "poll_id", "option_index"
				FROM (
					SELECT "option_index", "user_id", "id" AS "poll_id"
					FROM (
						SELECT %L::SMALLINT AS "option_index", (SELECT id FROM "User" WHERE identifier = %L::VARCHAR) AS "user_id"
					) AS "voted_data"
					CROSS JOIN "poll_id"
				) AS "insert_values" RETURNING *
				`,
				identifier,
				votedIndex,
				userIdentifier
			)
		} else {
			sqlVotedInsert = pgFormat(
				`
				WITH "poll_id" AS (
					SELECT "id" FROM "Poll" WHERE "identifier" = %L
				)

				INSERT INTO "Vote" (user_id, poll_id, option_index)
				SELECT "user_id", "poll_id", "option_index"
				FROM (
					SELECT "option_index", "user_id", "id" AS "poll_id"
					FROM (%s) AS "voted_data" CROSS JOIN "poll_id"
				) AS "insert_values" RETURNING *
				`,
				identifier,
				votedIndex
					.map(
						(optionIndex, i) =>
							(i === 0 ? '' : 'UNION ALL ') +
							pgFormat(
								'SELECT %L::SMALLINT AS "option_index", (SELECT id FROM "User" WHERE identifier = %L::VARCHAR) AS "user_id"',
								optionIndex,
								userIdentifier
							)
					)
					.join(' ')
			)
		}
		console.log('sql->->', sqlVotedInsert)

		const queryRes: QueryResult<GetPollDataWithVotesRow> = await pool.query(
			sqlVotedInsert
		)

		console.log('createVote =>', queryRes.rows)

		return queryRes
	} catch (e) {
		console.error('CREATE VOTE ERROR: ', e)

		return null
	}
}

export type RegisterVoteRow =
	| {
			type: 'single'
			data: {
				userIdentifier: string
				pollIdentifier: string
				optionIndex: number
			}
	  }
	| {
			type: 'multiple'
			data: {
				userIdentifier: string
				pollIdentifier: string
				optionIndex: number[]
			}
	  }
	| {
			type: 'rate'
			data: {
				userIdentifier: string
				pollIdentifier: string
				optionIndex: { index: number; rating: 1 | 2 | 3 | 4 | 5 }[]
			}
	  }
export async function registerVote({
	type,
	data: { userIdentifier, pollIdentifier, optionIndex },
}: RegisterVoteRow) {
	'use server'

	const client = await pool.connect()
	try {
		let voteData

		if (type === 'single') {
			if (Array.isArray(optionIndex))
				throw new Error('optionIndex should be a number')

			voteData = await registerSingleVote(client, {
				userIdentifier,
				pollIdentifier,
				optionIndex,
			})
		} else if (type === 'multiple') {
			if (
				!Array.isArray(optionIndex) ||
				(optionIndex.length > 0 && typeof optionIndex[0] === 'object')
			)
				throw new Error('optionIndex should be a number array')

			voteData = await registerMultipleVotes(client, {
				userIdentifier,
				pollIdentifier,
				optionIndexList: optionIndex as number[],
			})
		} else if (type === 'rate') {
			if (Array.isArray(optionIndex))
				throw new Error('optionIndex should be a number')

			return null
		}

		console.log('registerVote =>', voteData)

		return voteData
	} catch (e) {
		console.error(e)

		return null
	} finally {
		client.release()
	}
}

export type RegisterNewOptionRow =
	| {
			type: 'single' | 'multiple'
			data: {
				userIdentifier: string
				pollIdentifier: string
				optionLabel: string
				rating?: never
			}
	  }
	| {
			type: 'rate'
			data: {
				userIdentifier: string
				pollIdentifier: string
				optionLabel: string
				rating: 1 | 2 | 3 | 4 | 5
			}
	  }

export async function addNewOption({
	type,
	data: { userIdentifier, pollIdentifier, optionLabel, rating },
}: RegisterNewOptionRow) {
	'use server'

	const client = await pool.connect()
	try {
		let voteData

		if (userIdentifier.length < 0)
			throw new Error('userIdentifier should be a non-empty string')
		if (pollIdentifier.length < 0)
			throw new Error('pollIdentifier should be a non-empty string')
		if (optionLabel.length < 0)
			throw new Error('optionLabel should be a non-empty string')

		if (type === 'single' || type === 'multiple') {
			voteData = await registerNewOption(client, {
				userIdentifier,
				pollIdentifier,
				optionLabel,
				optionRating: -1,
			})
		} else if (type === 'rate') {
			if (![1, 2, 3, 4, 5].includes(rating ?? -1))
				throw new Error('rating should be a number between 1 and 5')

			voteData = await registerNewOption(client, {
				userIdentifier,
				pollIdentifier,
				optionLabel,
				optionRating: rating!,
			})
		}

		console.log('registerVote =>', voteData)

		return voteData
	} catch (e) {
		console.error(e)

		return null
	} finally {
		client.release()
	}
}
