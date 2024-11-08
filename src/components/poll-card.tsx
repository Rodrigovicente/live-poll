import React, { use, useEffect, useState } from 'react'
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from './ui/card'
import Link from 'next/link'
import { PollData } from '@/lib/db/queries/poll'
import { secToHours } from '@/lib/utils'

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
		creatorUserIdentifier,
		title,
		description,
		type,
		allowNewOptions,
		requiredProviders,
		requiredProviderSubs,
		isClosed: isClosedProp,
		endsAt,
		createdAt,
		voteRateCount,
	},
}: {
	pollData: PollData
}) {
	const [timeRemaining, setTimeRemaining] = useState(
		Math.floor((endsAt.getTime() - Date.now()) / 1000)
	)

	const [isClosed, setIsClosed] = useState(isClosedProp)

	useEffect(() => {
		const timeRemaining = endsAt.getTime() - Date.now()
		if (timeRemaining < 864000000) {
			setInterval(() => {
				const newTimeRemaining = Math.floor(
					(endsAt.getTime() - Date.now()) / 1000
				)
				setTimeRemaining(newTimeRemaining)
				if (newTimeRemaining <= 0) setIsClosed(true)
			}, 1000)
		}
	}, [endsAt])

	const timeToEnd =
		endsAt.getTime() <= Date.now() ? (
			<div>Ended at {endsAt.toLocaleString('pt-BR')}</div>
		) : (
			<div>
				{endsAt.getTime() - Date.now() > 864000000
					? `Ends at ${endsAt.toLocaleString('pt-BR')}`
					: `Ends in ${secToHours(timeRemaining)}`}
			</div>
		)

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
						<div>Votes: {voteRateCount}</div>
						<div>{timeToEnd}</div>
						<div>{type}</div>
					</div>
				</CardFooter>
			</Card>
		</Link>
	)
}

export default PollCard
