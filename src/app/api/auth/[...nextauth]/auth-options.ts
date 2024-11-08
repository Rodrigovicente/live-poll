import TwitchProvider from 'next-auth/providers/twitch'
import GoogleProvider from 'next-auth/providers/google'
import { getServerSession, NextAuthOptions } from 'next-auth'
import { createUser } from '@/lib/db/queries/user'
import {
	createAccount,
	createAccountWithUserIdentifier,
	findAccountByProviderAccountId,
} from '@/db/db/user_sql'
import pool from '@/lib/db/db'

const authOptions: NextAuthOptions = {
	secret: process.env.NEXTAUTH_SECRET,
	providers: [
		TwitchProvider({
			clientId: process.env.TWITCH_CLIENT_ID!,
			clientSecret: process.env.TWITCH_CLIENT_SECRET!,
		}),
		GoogleProvider({
			clientId: process.env.GOOGLE_CLIENT_ID!,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
		}),
	],
	callbacks: {
		async signIn(params) {
			const { account, user } = params

			const currentSession = await getServerSession(authOptions)

			const currentUserIdentifier = (currentSession as any)?.identifier

			console.log('=-=>', account, currentSession)

			// If there is a user logged in already that we recognize,
			// and we have an account that is being signed in with
			if (account && currentUserIdentifier) {
				const client = await pool.connect()

				// Do the account linking
				let existingAccount
				try {
					existingAccount = await findAccountByProviderAccountId(client, {
						provider: account.provider,
						providerAccountId: account.providerAccountId,
					})

					// if (existingAccount === null) throw new Error('Error querying account.')

					if (existingAccount) {
						throw new Error('Account is already connected to another user.')
					}

					// Only link accounts that have not yet been linked
					// Link the new account
					await createAccountWithUserIdentifier(client, {
						providerAccountId: account.providerAccountId,
						provider: account.provider,
						userIdentifier: currentUserIdentifier,
						username: user.name ?? '',
						email: user.email ?? '', // Email field not absolutely necessary, just for keeping record of user emails
					})
				} catch (err) {
					throw new Error('Error linking account.')
				} finally {
					client.release()
				}

				// Redirect to the home page after linking is complete
				return '/'
			}

			// Your Other logic to block sign-in's

			return true
		},
		async jwt(params) {
			const { token, account, user } = params

			console.log('account', account)

			// If there is an account for which we are generating JWT for (e.g on sign in)
			// then attach our userId to the token
			if (account) {
				const client = await pool.connect()

				let existingAppAccount
				try {
					existingAppAccount = await findAccountByProviderAccountId(client, {
						provider: account.provider,
						providerAccountId: account.providerAccountId,
					})
				} catch (err) {
					client.release()
					throw new Error('Error querying account.')
				}

				console.log('existingAppAccount', existingAppAccount)

				// User account already exists so set user id on token to be added to session in the session callback
				if (existingAppAccount) {
					token.identifier = existingAppAccount.identifier
				}

				// No account exists under this provider account id so probably new "user"
				if (!existingAppAccount) {
					const appUser = await createUser({
						initialProvider: account.provider, // Provider field not absolutely necessary, just for keeping record of provider the account was created with
					})

					if (appUser == undefined) throw new Error('Error querying user.')

					let newAppAccount
					try {
						newAppAccount = await createAccount(client, {
							providerAccountId: account.providerAccountId,
							provider: account.provider,
							userId: appUser.id,
							username: user.name ?? '',
							email: user.email ?? '', // Email field not absolutely necessary, just for keeping record of user emails
						})
					} catch (err) {
						throw new Error('Error linking account.')
					} finally {
						client.release()
					}

					if (newAppAccount == null) throw new Error('Error querying account.')

					token.identifier = newAppAccount.identifier
				}
			}

			return token
		},
		async session({ session, token }) {
			// Attach the user id from our table to session to be able to link accounts later on sign in
			// when we make the call to getServerSession
			console.log('->session', session, token)
			session = Object.assign({}, session, {
				identifier: token.identifier,
			})
			return session
		},
	},
}

export default authOptions
