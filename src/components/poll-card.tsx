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
import { cn, secToHours } from '@/lib/utils'
import { CheckCircleIcon } from 'lucide-react'
import PollMultipleIcon from './icons/poll-multiple-icon'
import { Separator } from './ui/separator'
import { getFormattedPollType } from '@/app/poll/utils'
import PollSingleIcon from './icons/poll-single-icon'
import PollRateIcon from './icons/poll-rate-icon'

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
		hasVoted,
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

	let pollIcons
	if (type === 'single') {
		pollIcons = <PollSingleIcon size={22} className="text-card-foreground" />
	} else if (type === 'multiple') {
		pollIcons = <PollMultipleIcon size={22} className="text-card-foreground" />
	} else {
		pollIcons = <PollRateIcon size={22} className="text-card-foreground" />
	}

	return (
		<Link href={`/poll/${identifier}`}>
			<Card
				className={cn(
					'flex flex-row items-stretch gap-3 hoverable',
					isClosed ? 'disabled' : ''
				)}
			>
				<div className="flex grow-0 flex-col items-center justify-start gap-4">
					{pollIcons}
					{hasVoted && (
						<CheckCircleIcon size={18} className="text-card-muted-foreground" />
					)}
				</div>
				<div className="my-auto">
					<CardHeader>
						<CardTitle>{title}</CardTitle>
						<CardDescription>
							<div className="flex flex-row gap-3">
								<span>{getFormattedPollType(type)}</span>
								<span>•</span>
								<span>{timeToEnd}</span>
								<span>•</span>
								<span>
									{voteRateCount} {type === 'rate' ? 'ratings' : 'votes'}
								</span>
							</div>
						</CardDescription>
					</CardHeader>
					{description && (
						<CardContent>
							<p className="line-clamp-3">{description}</p>
						</CardContent>
					)}
					{/* <CardFooter></CardFooter> */}
				</div>
			</Card>
		</Link>
	)
}

export default PollCard
