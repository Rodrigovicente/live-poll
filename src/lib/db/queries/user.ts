'use server'

import { QueryResult } from 'pg'
import pool from '../db'
import { nanoid } from '@/lib/utils'

export type CreateUserParams = {
	provider: string
}
export type CreateUserRow = {
	id: string
	identifier: string
	provider: string
	created_at: Date
}
export async function createUser({
	provider,
}: CreateUserParams): Promise<QueryResult<CreateUserRow> | null> {
	'use server'

	const identifier = nanoid(11)

	try {
		const queryRes = await pool.query(
			`
				INSERT INTO "User" (provider, identifier)
				VALUES ($1, $2) RETURNING *
			`,
			[provider, identifier]
		)

		console.log('createUser =>', queryRes.rows)

		return queryRes
	} catch (e) {
		console.error(e)

		return null
	}
}

export type FindUserByIdRow = {
	provider: string
	created_at: Date
}
export async function findUserById(userId: string) {
	'use server'

	try {
		const queryRes: QueryResult<FindUserByIdRow> = await pool.query(
			`
				SELECT provider, created_at
				FROM "User"
				WHERE id = $1
			`,
			[userId]
		)

		console.log('findUserById =>', queryRes.rows)

		return queryRes
	} catch (e) {
		console.error(e)

		return null
	}
}

export type FindAccountParams = {
	providerAccountId: string
	provider: string
}
export async function findAccount({
	provider,
	providerAccountId,
}: FindAccountParams): Promise<QueryResult<{
	id: string
	user_id: string
	provider: string
	provider_account_id: string
	email: string
	created_at: Date
}> | null> {
	'use server'

	try {
		const queryRes = await pool.query(
			`
				SELECT *
				FROM "Account"
				WHERE provider = $1 AND provider_account_id = $2
			`,
			[provider, providerAccountId]
		)

		console.log('findAccount =>', queryRes.rows)

		return queryRes
	} catch (e) {
		console.error(e)

		return null
	}
}

export type CreateAccountParams = {
	userId: string
	provider: string
	providerAccountId: string
	email: string
}
export type CreateAccountRow = {
	id: string
	user_id: string
	provider: string
	provider_account_id: string
	email: string
	created_at: Date
}
export async function createAccount({
	userId,
	provider,
	providerAccountId,
	email,
}: CreateAccountParams): Promise<QueryResult<CreateAccountRow> | null> {
	'use server'

	try {
		const queryRes = await pool.query(
			`
				INSERT INTO "Account" (user_id, provider, provider_account_id, email)
				VALUES ($1, $2, $3, $4) RETURNING *
			`,
			[userId, provider, providerAccountId, email]
		)

		console.log('createAccount =>', queryRes.rows)

		return queryRes
	} catch (e) {
		console.error(e)

		return null
	}
}

export type GetAccountsByUserIdRow = {
	provider: string
	provider_account_id: string
	email: string
	created_at: Date
}
export async function getAccountsByUserId(userId: string) {
	'use server'

	try {
		const queryRes: QueryResult<GetAccountsByUserIdRow> = await pool.query(
			`
				SELECT "Account".provider AS provider, provider_account_id, email, "Account".created_at AS created_at
				FROM "Account"
				INNER JOIN "User" ON "Account".user_id = "User".id
				WHERE "User".id = $1
			`,
			[userId]
		)

		console.log('getAccountsByUserId =>', queryRes.rows)

		return queryRes
	} catch (e) {
		console.error(e)

		return null
	}
}
