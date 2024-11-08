'use client'

import { Button } from '@/components/ui/button'
import { signIn } from 'next-auth/react'
import { IconType, SiGoogle, SiTwitch } from '@icons-pack/react-simple-icons'
import React from 'react'
import { FormattedUserData } from '@/lib/db/queries/user'
import { useRouter } from 'next/navigation'
import { getUserDataRow } from '@/db/db/user_sql'

type ProviderData = {
	id: string
	name: string
	Icon: IconType
}
const providerList: ProviderData[] = [
	{
		id: 'twitch',
		name: 'Twitch',
		Icon: SiTwitch,
	},
	{
		id: 'google',
		name: 'Google',
		Icon: SiGoogle,
	},
]
export default function LinkAccounts({
	user,
	accounts,
}: {
	user?: Pick<getUserDataRow, 'identifier'>
	accounts?: FormattedUserData['accounts']
}) {
	const router = useRouter()

	if (user == null) router.replace('/')

	const linkedProviders = accounts?.map(account => ({
		provider: account.provider,
		email: account.email,
	}))

	return (
		<div>
			<p className="text-2xl">Link accounts:</p>
			<u>
				{providerList.map(provider => {
					const isLinked = accounts
						?.map(account => account.provider)
						.includes(provider.id)
					return (
						<li key={provider.id}>
							<LinkButton
								provider={provider}
								isLinked={isLinked}
								email={
									accounts?.find(account => account.provider === provider.id)
										?.email
								}
							/>
						</li>
					)
				})}
			</u>
		</div>
	)
}

function LinkButton({
	provider: { id, name, Icon },
	disabled,
	isLinked = false,
	email,
}: {
	provider: ProviderData
	disabled?: boolean
	isLinked?: boolean
	email?: string
}) {
	if (isLinked) disabled = true

	let emailCensored = email
	if (email) {
		const emailParts = email?.split('@')
		const emailStart =
			emailParts[0].length > 3 ? emailParts[0].slice(0, 3) : emailParts[0][0]
		emailParts[0] = emailStart.padEnd(emailParts[0].length, '*')
		emailCensored = ' (' + emailParts[0] + '@' + emailParts[1] + ')'
	}

	return (
		<Button
			key={id}
			onClick={() => signIn(id)}
			disabled={disabled}
			title={email}
		>
			<Icon />
			{isLinked ? `${name} account already linked ` : `Link a ${name} account`}
			{email && emailCensored}
		</Button>
	)
}
