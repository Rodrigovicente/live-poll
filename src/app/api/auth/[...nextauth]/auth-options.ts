import TwitchProvider from 'next-auth/providers/twitch'

const authOptions = {
	providers: [
		TwitchProvider({
			clientId: process.env.TWITCH_CLIENT_ID!,
			clientSecret: process.env.TWITCH_CLIENT_SECRET!,
		}),
	],
}

export default authOptions
