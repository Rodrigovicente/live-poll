import LinkAccounts from './components/link-accounts'
import { findUserById } from '@/lib/db/queries/user'
import authOptions from '../../api/auth/[...nextauth]/auth-options'
import { getServerSession, Session } from 'next-auth'
import { getAccountsByUserId } from '@/lib/db/queries/user'
import { redirect } from 'next/navigation'

export default async function SettingsPage() {
	const session: (Session & { userId: string }) | null = await getServerSession(
		authOptions
	)

	if (session?.userId == null) {
		return redirect('/')
	}

	const user = (await findUserById(session.userId))?.rows[0]
	const accounts = (await getAccountsByUserId(session.userId))?.rows

	console.log('user', user)
	console.log('accounts', accounts)

	return (
		<div className="w-full space-y-2">
			<p className="text-2xl">Settings</p>
			<LinkAccounts user={user} accounts={accounts} />
		</div>
	)
}
