'use server'

import pool from '../db'
import { nanoid } from '@/lib/utils'
import {
	createUserArgs,
	createUserRow,
	createUser as createUserQuery,
	getUserData,
	getUserDataByIdentifier,
} from '@/db/db/user_sql'

export async function createUser({
	initialProvider,
}: Omit<createUserArgs, 'identifier'>): Promise<createUserRow | null> {
	'use server'

	const identifier = nanoid(11)

	const client = await pool.connect()

	try {
		const userRow = await createUserQuery(client, {
			identifier,
			initialProvider,
		})

		console.log('createUser =>', userRow)

		return userRow
	} catch (err) {
		console.error(err)

		return null
	} finally {
		client.release()
	}
}

export type FormattedUserData = {
	identifier: string
	initialProvider: string
	accounts: {
		provider: string
		providerAccountId: string
		username: string
		email: string
		createdAt: Date
	}[]
	preferences: {
		theme: string | null
		requestsMinVotes: number | null
	}
}
export async function getFormattedUserDataByIdentifier(identifier: string) {
	'use server'

	const client = await pool.connect()

	try {
		const userDataRows = await getUserDataByIdentifier(client, {
			identifier: identifier,
		})

		console.log('getFormattedUserDataByIdentifier =>', userDataRows)

		const userData = {
			identifier: userDataRows[0].identifier,
			initialProvider: userDataRows[0].initialProvider,
			accounts: userDataRows.map(row => ({
				provider: row.provider,
				providerAccountId: row.providerAccountId,
				username: row.username,
				email: row.email,
				createdAt: row.createdAt,
			})),
			preferences: {
				theme: userDataRows[0].theme,
				requestsMinVotes: userDataRows[0].requestsMinVotes,
			},
		}

		return userData
	} catch (e) {
		console.error(e)
		return null
	} finally {
		client.release()
	}
}
