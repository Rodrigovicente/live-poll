import TwitchProvider from 'next-auth/providers/twitch'
import GoogleProvider from 'next-auth/providers/google'
import { getServerSession, NextAuthOptions } from 'next-auth'
import { createAccount, findAccount } from '@/lib/db/queries/user'
import { createUser } from '@/lib/db/queries/user'

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

			const currentUserId = (currentSession as any)?.userId

			console.log('=-=>', account, currentSession)

			// If there is a user logged in already that we recognize,
			// and we have an account that is being signed in with
			if (account && currentUserId) {
				// Do the account linking
				const existingAccount = (
					await findAccount({
						provider: account.provider,
						providerAccountId: account.providerAccountId,
					})
				)?.rows[0]

				if (existingAccount === null) throw new Error('Error querying account.')

				if (existingAccount) {
					throw new Error('Account is already connected to another user.')
				}

				// Only link accounts that have not yet been linked
				// Link the new account
				await createAccount({
					providerAccountId: account.providerAccountId,
					provider: account.provider,
					userId: currentUserId,
					email: user.email!, // Email field not absolutely necessary, just for keeping record of user emails
				})

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
				const existingAppAccount = (
					await findAccount({
						provider: account.provider,
						providerAccountId: account.providerAccountId,
					})
				)?.rows[0]

				console.log('existingAppAccount', existingAppAccount)

				if (existingAppAccount === null)
					throw new Error('Error querying account.')

				// User account already exists so set user id on token to be added to session in the session callback
				if (existingAppAccount) {
					token.userId = existingAppAccount.user_id
				}

				// No account exists under this provider account id so probably new "user"
				if (!existingAppAccount) {
					const appUser = (
						await createUser({
							provider: account.provider, // Provider field not absolutely necessary, just for keeping record of provider the account was created with
						})
					)?.rows[0]

					if (appUser === undefined) throw new Error('Error querying user.')

					const newAppAccount = (
						await createAccount({
							providerAccountId: account.providerAccountId,
							provider: account.provider,
							userId: appUser.id,
							email: user.email!, // Email field not absolutely necessary, just for keeping record of user emails
						})
					)?.rows[0]

					if (newAppAccount === undefined)
						throw new Error('Error querying account.')

					token.userId = newAppAccount.user_id
				}
			}

			return token
		},
		async session({ session, token }) {
			// Attach the user id from our table to session to be able to link accounts later on sign in
			// when we make the call to getServerSession
			console.log('->session', session, token)
			session = Object.assign({}, session, {
				userId: token.userId,
			})
			return session
		},
	},
}

export default authOptions
