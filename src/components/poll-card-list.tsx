'use client'
import React, { useEffect, useState } from 'react'
import PollCard from './poll-card'
import { getPollDataListFromUserByIdentifierRow } from '@/db/db/poll_sql'
import { getPollCardList } from '@/app/(dashboard)/actions'
import { SessionContextValue, useSession } from 'next-auth/react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { useSearchParams } from 'next/navigation'
import { useRouter } from 'next/navigation'
import { Button } from './ui/button'
import Link from 'next/link'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import SelectField from './ui/select-field'
import { useForm } from 'react-hook-form'
import {
	boolean,
	custom,
	InferInput,
	object,
	optional,
	pipe,
	string,
} from 'valibot'
import { valibotResolver } from '@hookform/resolvers/valibot'
import { Checkbox } from './ui/checkbox'
import { Label } from './ui/label'
import { FilterIcon, PlusIcon } from 'lucide-react'

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

	const router = useRouter()
	const params = useSearchParams()
	let filter = params.get('filter')
	if (!['open', 'closed', 'all'].includes(filter as string)) filter = 'open'

	useEffect(() => {
		const openFilter = filter

		const getPolls = async () => {
			const response = await getPollCardList(
				session?.data.identifier,
				openFilter as 'open' | 'closed' | 'all'
			)
			console.log(session, response)

			if (response.success) {
				setPollDataList(response.payload)
			} else {
				setPollDataList(null)
			}
		}

		getPolls()
	}, [setPollDataList, session, filter])

	return (
		<div>
			<div className="w-full my-5 flex justify-center">
				<Tabs
					defaultValue="account"
					value={filter as string}
					onValueChange={v => router.push(`?filter=${v}`)}
					// className="w-[400px]"
				>
					<TabsList className="px-1 py-5 gap-1">
						<TabsTrigger className="px-5 py-1 text-base" value="open">
							Open Polls
						</TabsTrigger>
						<TabsTrigger className="px-5 py-1 text-base" value="closed">
							Closed Polls
						</TabsTrigger>
						<TabsTrigger className="px-5 py-1 text-base" value="all">
							All Polls
						</TabsTrigger>
					</TabsList>
					<TabsContent value="account">
						Make changes to your account here.
					</TabsContent>
					<TabsContent value="password">Change your password here.</TabsContent>
				</Tabs>
			</div>
			<div className="w-full my-5 flex justify-between">
				<Popover>
					<PopoverTrigger asChild>
						<Button variant="glowy">
							Filter
							<FilterIcon size={18} className="ml-2" />
						</Button>
					</PopoverTrigger>
					<PopoverContent align="start">
						<FilterForm />
					</PopoverContent>
				</Popover>
				<Button variant="glowy" asChild>
					<Link href="/new">
						<PlusIcon size={18} className="mr-2" />
						New Poll
					</Link>
				</Button>
			</div>
			{pollDataList ? (
				<div className="flex flex-col gap-5">
					{pollDataList.map(poll => (
						<PollCard key={poll.identifier} pollData={poll} />
					))}
				</div>
			) : (
				<>Loading...</>
			)}
		</div>
	)
}

export default PollCardList

const filterTypeOptions = [
	{ value: 'all', label: 'All' },
	{ value: 'single', label: 'Single choice' },
	{ value: 'multiple', label: 'Multiple choice' },
	{ value: 'rate', label: 'Rating' },
]

const filterVoteSituationOptions = [
	{ value: 'all', label: 'All' },
	{ value: 'voted', label: 'Voted' },
	{ value: 'unvoted', label: 'Unvoted' },
]

const pollFilterSchema = object({
	type: optional(
		pipe(
			string(),
			custom(v => filterTypeOptions.map(o => o.value).includes(v as string))
		)
	),
	voteSituation: optional(
		pipe(
			string(),
			custom(v =>
				filterVoteSituationOptions.map(o => o.value).includes(v as string)
			)
		)
	),
})

const filterFormDefaultValues: InferInput<typeof pollFilterSchema> = {
	type: 'all',
	voteSituation: 'all',
}

export type PollFilterForm = InferInput<typeof pollFilterSchema>

function FilterForm() {
	const { control, handleSubmit, reset } = useForm<PollFilterForm>({
		resolver: valibotResolver(pollFilterSchema),
		defaultValues: filterFormDefaultValues,
	})

	function onSubmit(data: PollFilterForm) {
		console.log(data)
	}

	return (
		<form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
			<div>
				<Label htmlFor="filter-type">Poll type:</Label>
				<SelectField
					control={control}
					name="type"
					options={filterTypeOptions}
					id="filter-type"
				/>
			</div>
			<div>
				<Label htmlFor="filter-vote-situation">Vote Situation:</Label>
				<SelectField
					control={control}
					name="voteSituation"
					options={filterVoteSituationOptions}
					id="filter-vote-situation"
				/>
			</div>
			<div className="flex justify-end gap-2">
				<Button variant="ghost" onClick={() => reset(filterFormDefaultValues)}>
					Clear
				</Button>
				<Button type="submit">Filter</Button>
			</div>
		</form>
	)
}
