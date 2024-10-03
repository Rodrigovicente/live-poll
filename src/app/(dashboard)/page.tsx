import React from 'react'
import { getPollCardList } from './actions'
import PollCard from '@/components/poll-card'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

async function Dashboard() {
	const response = await getPollCardList()

	const pollCardList = response.success ? response.payload : null

	return (
		<>
			<div>Home</div>

			<Button asChild>
				<Link href="/new">NEW POLL</Link>
			</Button>

			{pollCardList?.map(poll => (
				<PollCard key={poll.identifier} pollData={poll} />
			))}
		</>
	)
}

export default Dashboard
