import LinkAccounts from './components/link-accounts'
import { getFormattedUserDataByIdentifier } from '@/lib/db/queries/user'
import authOptions from '../../api/auth/[...nextauth]/auth-options'
import { getServerSession, Session } from 'next-auth'
import { redirect } from 'next/navigation'

export default async function SettingsPage() {
	const session: (Session & { identifier: string }) | null =
		await getServerSession(authOptions)

	if (session?.identifier == null) {
		return redirect('/')
	}

	const userData = await getFormattedUserDataByIdentifier(session.identifier)
	const user = userData
		? {
				identifier: userData.identifier,
		  }
		: undefined
	const accounts = userData?.accounts

	console.log('user', user)
	console.log('accounts', accounts)

	return (
		<div className="w-full space-y-2">
			<p className="text-2xl">Settings</p>
			<LinkAccounts user={user} accounts={accounts} />
		</div>
	)
}
