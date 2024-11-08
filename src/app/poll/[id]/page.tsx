import { NextResponse } from 'next/server'
import React from 'react'
import PollForm from './components/poll-form'
import { getPollWithVotes } from './actions'
import Link from 'next/link'
import { ApiResponse } from '@/app/api/utils'
import { Button } from '@/components/ui/button'
import { getServerSession, Session } from 'next-auth'
import authOptions from '@/app/api/auth/[...nextauth]/auth-options'

export const revalidate = 0
export const fetchCache = 'force-no-store'
export const dynamic = 'force-dynamic'

export type PollData = {
	identifier: string
	title: string
	description?: string | null
	type: string
	isClosed: boolean
	hasVoted: boolean
	hasCreatedOption: boolean
	allowNewOptions: boolean
	allowVoteEdit: boolean
	requiredProviders?: string[] | null
	requiredProviderSubs?: string[] | null
	endsAt: Date
	createdAt: Date
	options: {
		index: number
		label: string
		voteRateCount?: number | null
		isVoted?: boolean | null
	}[]
}

async function PollPage({ params: { id } }: { params: { id: string } }) {
	const session: (Session & { identifier: string }) | null =
		await getServerSession(authOptions)

	const pollData: ApiResponse<PollData> = await getPollWithVotes(
		id,
		session?.identifier
	)

	if (!pollData || !pollData.success) return <div>Poll not found</div>
	return (
		<div>
			<h2 className="text-xl">{pollData.payload.title}</h2>
			<p>{pollData.payload.description}</p>
			<p>{pollData.payload.isClosed ? 'closed' : 'open'}</p>
			<p>{pollData.payload.hasVoted ? 'has voted' : 'did not vote'}</p>
			<p>
				(new options:{' '}
				{pollData.payload.allowNewOptions ? 'allowed' : 'not allowed'})
			</p>
			<p>
				(allow edition:{' '}
				{pollData.payload.allowVoteEdit ? 'allowed' : 'not allowed'})
			</p>
			<Button asChild>
				<Link href="/">HOME</Link>
			</Button>
			<PollForm
				pollData={pollData.payload}
				userIdentifier={session?.identifier}
			/>
		</div>
	)
}

export default PollPage
