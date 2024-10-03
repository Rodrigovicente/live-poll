import React from 'react'
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from './ui/card'
import Link from 'next/link'

export type PollCardData = {
	identifier: string
	title: string
	description: string
	isMultiple: boolean
	voteCount: number
	timeRemaining: number
	isClosed: boolean
	createdAt: Date
}

function PollCard({
	pollData: {
		identifier,
		title,
		description,
		isMultiple,
		voteCount,
		timeRemaining,
		isClosed,
	},
}: {
	pollData: PollCardData
}) {
	return (
		<Link href={`/poll/${identifier}`}>
			<Card className={isClosed ? 'opacity-70' : ''}>
				<CardHeader>
					<CardTitle>{title}</CardTitle>
					<CardDescription>{description}</CardDescription>
				</CardHeader>
				{/* <CardContent>
				<p>Card Content</p>
			</CardContent> */}
				<CardFooter>
					<div>
						<div>Votes: {voteCount}</div>
						<div>Time: {timeRemaining}</div>
						<div>{isMultiple ? 'Multiple' : 'Single'}</div>
					</div>
				</CardFooter>
			</Card>
		</Link>
	)
}

export default PollCard
