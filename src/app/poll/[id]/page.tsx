import { NextResponse } from 'next/server'
import React from 'react'
import PollForm from './components/poll-form'
import { getPoll } from './actions'
import Link from 'next/link'
import { ApiResponse } from '@/app/api/utils'
import { Button } from '@/components/ui/button'

export const revalidate = 0
export const fetchCache = 'force-no-store'
export const dynamic = 'force-dynamic'

export type PollData = {
	identifier: string
	title: string
	description: string
	isMultiple: boolean
	isClosed: boolean
	hasVoted: boolean
	allowNewOptions: boolean
	timeRemaining: number
	createdAt: Date
	options: { text: string; voteCount: number; isVoted?: boolean }[]
}

async function PollPage({ params: { id } }: { params: { id: string } }) {
	const pollData: ApiResponse<PollData> = await getPoll(id)

	if (!pollData || !pollData.success) return <div>Poll not found</div>
	return (
		<div>
			<h2>{pollData.payload.title}</h2>
			<Button asChild>
				<Link href="/">HOME</Link>
			</Button>
			<PollForm pollData={pollData.payload} />
		</div>
	)
}

export default PollPage
