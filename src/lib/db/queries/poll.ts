'use server'

import pgFormat from 'pg-format'
import { QueryResult } from 'pg'
import pool from '../db'
import { nanoid } from '@/lib/utils'

export type CreatePollParams = {
	title: string
	options: {
		optionText: string
	}[]
	description: string
	isMultiple: boolean
	allowNewOptions: boolean
	requireTwitchAccount: boolean
	requireGoogleAccount: boolean
	requireTwitchSub: boolean
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
					INSERT INTO "Poll" (identifier, title, description, is_multiple, is_closed, allow_new_options, require_twitch_account, require_google_account, require_twitch_sub, ends_at)
					SELECT $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
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
				newPollData.requireTwitchAccount,
				newPollData.requireGoogleAccount,
				newPollData.requireTwitchSub,
				newPollData.endsAt,
			]
		)

		console.log('getPollList =>', queryRes.rows)

		return queryRes
	} catch (e) {
		console.error(e)

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
export async function getPollList() {
	'use server'

	try {
		const queryRes: QueryResult<any> = await pool.query(
			`
				SELECT identifier, title, description, is_multiple, allow_new_options, require_twitch_account, require_google_account, is_closed, ends_at created_at
				FROM "Poll"
			`
		)

		console.log('getPollList =>', queryRes.rows)

		return queryRes
	} catch (e) {
		console.error(e)

		return null
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
	userId?: string
) {
	'use server'

	try {
		const queryRes: QueryResult<GetPollDataWithVotesRow> = await pool.query(
			`
				SELECT identifier, title, description, is_multiple, allow_new_options, require_twitch_account, require_google_account, require_twitch_sub, ends_at, is_closed, created_at, index, text, COUNT(option_index) AS vote_count
				FROM (
					SELECT id, identifier, title, description, is_multiple, allow_new_options, require_twitch_account, require_google_account, require_twitch_sub, ends_at, is_closed, created_at, index, text FROM "Poll"
					INNER JOIN "PollOption"
					ON "Poll".id = "PollOption".poll_id
					WHERE identifier = $1
				) AS "poll_with_options"
				INNER JOIN "Vote"
				ON "poll_with_options".id = "Vote".poll_id AND "poll_with_options".index = "Vote".option_index
				GROUP BY  id, identifier, title, description, is_multiple, allow_new_options, require_twitch_account, require_google_account, require_twitch_sub, ends_at, is_closed, created_at, index, text, "Vote".option_index
			`,
			[identifier]
		)

		console.log('getPollDataWithVotes =>', queryRes.rows)

		return queryRes
	} catch (e) {
		console.error(e)

		return null
	}
}

export type CreateVoteRow = {
	user_id: string
	poll_id: string
	option_index: number
}
export async function createVote(
	identifier: string,
	userId: string,
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
						SELECT %L::SMALLINT AS "option_index", %L::BIGINT AS "user_id"
					) AS "voted_data"
					CROSS JOIN "poll_id"
				) AS "insert_values" RETURNING *
				`,
				identifier,
				votedIndex,
				userId
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
								'SELECT %L::SMALLINT AS "option_index", %L::BIGINT AS "user_id"',
								optionIndex,
								userId
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
		console.error(e)

		return null
	}
}
