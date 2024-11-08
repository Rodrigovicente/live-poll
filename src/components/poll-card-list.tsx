'use client'
import React, { useEffect, useState } from 'react'
import PollCard from './poll-card'
import { getPollDataListFromUserByIdentifierRow } from '@/db/db/poll_sql'
import { getPollCardList } from '@/app/(dashboard)/actions'
import { SessionContextValue, useSession } from 'next-auth/react'

const PollCardList = ({
	pollDataList: pollDataListProp,
}: {
	pollDataList: getPollDataListFromUserByIdentifierRow[] | null
}) => {
	const session = useSession() as SessionContextValue<any> & {
		data: { identifier: string }
	}

	const [pollDataList, setPollDataList] = useState<
		getPollDataListFromUserByIdentifierRow[] | null
	>(pollDataListProp)

	useEffect(() => {
		;(async () => {
			const response = await getPollCardList(session?.data.identifier)
			console.log(session, response)

			if (response.success) {
				setPollDataList(response.payload)
			}
		})()
	}, [setPollDataList, session])

	return (
		<div>
			{pollDataList?.map(poll => (
				<PollCard key={poll.identifier} pollData={poll} />
			))}
		</div>
	)
}

export default PollCardList
