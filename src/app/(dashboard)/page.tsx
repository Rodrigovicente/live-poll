import React from 'react'
import { getPollCardList } from './actions'
import PollCard from '@/components/poll-card'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { getServerSession, Session } from 'next-auth'
import authOptions from '../api/auth/[...nextauth]/auth-options'
import PollCardList from '@/components/poll-card-list'

async function Dashboard() {
	const session: (Session & { identifier: string }) | null =
		await getServerSession(authOptions)

	if (session?.identifier == null) {
		return null
	}

	const response = await getPollCardList(session?.identifier)

	const pollCardList = response.success ? response.payload : null

	return (
		<>
			<div>Home</div>
			<Button asChild>
				<Link href="/new">NEW POLL</Link>
			</Button>
			<PollCardList pollDataList={pollCardList} />
		</>
	)
}

export default Dashboard
