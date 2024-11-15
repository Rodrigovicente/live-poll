'use client'

import { valibotResolver } from '@hookform/resolvers/valibot'
import React, {
	memo,
	useMemo,
	useOptimistic,
	useState,
	useTransition,
} from 'react'
import {
	Control,
	FieldErrors,
	set,
	useForm,
	UseFormGetValues,
	UseFormRegister,
	UseFormSetValue,
} from 'react-hook-form'
import {
	array,
	boolean,
	custom,
	empty,
	InferInput,
	is,
	literal,
	nonEmpty,
	nullish,
	number,
	object,
	optional,
	pipe,
	string,
	transform,
	union,
	variant,
} from 'valibot'
import { PollData } from '../page'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { votePollSingle, votePollMultiple, votePollRate } from '../actions'
import RatingOption from '../../../../components/ui/rating-option'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'

const PollSchema = object({
	votedOptions: union([
		array(optional(boolean())),
		string(),
		array(
			nullish(
				pipe(
					number(),
					transform(v => (v < 1 || v > 5 ? undefined : v))
					// custom<number>(n => (n as number) >= 1 || (n as number) <= 5)
				)
			)
		),
	]),
	// newOption: optional(
	// 	object({
	// 		optionText: pipe(string(), nonEmpty("Option text can't be empty")),
	// 	})
	// ),
	newOption: variant('has', [
		object({
			has: literal(false),
			optionText: optional(string()),
			rating: nullish(number()),
		}),
		object({
			has: literal(true),
			optionText: pipe(string(), nonEmpty("Label can't be empty")),
			rating: nullish(number()),
		}),
	]),
})

export type PollForm = InferInput<typeof PollSchema>

export function PollForm({
	pollData: pollDataProp,
	userIdentifier,
}: {
	pollData: PollData
	userIdentifier?: string
}) {
	const [pollData, setPollData] = useState(pollDataProp)
	console.log('pollData', pollData)

	const [isPending, startTransition] = useTransition()

	const [expandAll, setExpandAll] = useState(false)

	const [optimisticPollData, addOptimisticPollData] = useOptimistic<
		PollData,
		number | number[] | [number, 1 | 2 | 3 | 4 | 5][]
	>(pollData, (currPollData, votedOption) => {
		if (typeof votedOption === 'number') {
			// case of single
			return {
				...currPollData,
				options: currPollData.options.map(opt => {
					if (opt.index === votedOption) {
						return {
							...opt,
							isVoted: true,
							voteRateCount: opt.isVoted
								? opt.voteRateCount
								: opt.voteRateCount
								? opt.voteRateCount + 1
								: 1,
						}
					} else {
						return {
							...opt,
							isVoted: false,
							voteRateCount: opt.isVoted
								? opt.voteRateCount
									? opt.voteRateCount - 1
									: 0
								: 0,
						}
					}
				}),
			}
		} else if (
			Array.isArray(votedOption) &&
			(votedOption.length > 0 ? typeof votedOption[0] === 'number' : true)
		) {
			// case of multiple
			return {
				...currPollData,
				options: currPollData.options.map(opt => {
					if ((votedOption as number[]).includes(opt.index)) {
						return {
							...opt,
							voteRateCount: opt.isVoted
								? opt.voteRateCount
								: opt.voteRateCount
								? opt.voteRateCount + 1
								: 1,
							isVoted: true,
						}
					} else {
						return {
							...opt,
							voteRateCount: opt.isVoted
								? opt.voteRateCount
									? opt.voteRateCount - 1
									: 0
								: 0,
							isVoted: false,
						}
					}
				}),
			}
		} else if (
			Array.isArray(votedOption) &&
			(votedOption.length > 0 ? Array.isArray(votedOption[0]) : true)
		) {
			// case of rating
			return {
				...currPollData,
				options: currPollData.options.map(opt => {
					const sameIndexRating = (
						votedOption as [number, 1 | 2 | 3 | 4 | 5][]
					).find(
						votedOpt => votedOpt[0] === opt.index && votedOpt[1] === opt.rating
					)
					if (sameIndexRating) {
						return {
							...opt,
							voteRateCount: opt.isVoted
								? opt.voteRateCount
								: opt.voteRateCount
								? opt.voteRateCount + 1
								: 1,
							isVoted: true,
							rating: sameIndexRating[1],
						}
					} else {
						return {
							...opt,
							voteRateCount: opt.isVoted
								? opt.voteRateCount
									? opt.voteRateCount - 1
									: 0
								: 0,
							isVoted: false,
							rating: undefined,
						}
					}
				}),
			}
		} else {
			return currPollData
		}
	})

	const {
		register,
		control,
		handleSubmit,
		watch,
		setValue,
		getValues,
		setError,
		formState: { isSubmitting, isSubmitted, errors },
	} = useForm<PollForm>({
		resolver: valibotResolver(PollSchema),
		defaultValues: {
			votedOptions: pollOptionsToFormValue(pollData.type, pollData.options),
			newOption: {
				has: false,
				optionText: '',
			},
		},
		disabled:
			pollData.isClosed ||
			(pollData.hasVoted && !pollData.allowVoteEdit) ||
			!userIdentifier ||
			isPending,
	})

	const newOption = watch('newOption')

	async function onSubmit(data: PollForm) {
		console.log('onSubmit', data)

		if (
			pollData.type === 'rate' &&
			data.newOption.has &&
			!data.newOption.rating
		) {
			setError('newOption.rating', { message: 'Please select a rating' })
			return
		}
		startTransition(async () => {
			const newOption = data.newOption.has
				? {
						label: data.newOption.optionText,
						rating:
							pollData.type === 'rate' ? data.newOption.rating : undefined,
				  }
				: undefined

			if (pollData.type === 'single') {
				if (typeof data.votedOptions !== 'string') {
					console.error('Invalid voted options')
					return
				}
				const votedOptionIndex = +data.votedOptions

				if (isNaN(votedOptionIndex)) {
					console.error('Invalid voted option')
					return
				}
				addOptimisticPollData(votedOptionIndex)
				const res = await votePollSingle(
					pollData.identifier,
					votedOptionIndex,
					newOption as { label: string; rating?: never } | undefined
				)

				console.log(res)
				if (!res) return

				if (res.success) {
					setPollData(res.payload)
				} else {
					setValue(
						'votedOptions',
						pollData.options.find(opt => opt.isVoted)?.index?.toString() ?? ''
					)
					console.error(res.error)
				}
			} else if (pollData.type === 'multiple') {
				if (
					!Array.isArray(data.votedOptions) ||
					(data.votedOptions.length > 0 &&
						typeof data.votedOptions[0] !== 'boolean')
				) {
					console.error('Invalid voted options')
					return
				}
				const votedOptionIndexes = data.votedOptions.reduce((acc, curr, i) => {
					if (curr) acc.push(i)
					return acc
				}, [] as number[])

				// const votedOption = pollData.options.reduce((acc, curr) => {
				// 	if (data.votedOptions[curr.index]) acc.push(curr.index)

				// 	return acc
				// }, [] as number[])

				addOptimisticPollData(votedOptionIndexes)
				const res = await votePollMultiple(
					pollData.identifier,
					votedOptionIndexes,
					newOption as { label: string; rating?: never } | undefined
				)

				console.log(res)
				if (!res) return

				if (res.success) {
					setPollData(res.payload)
				} else {
					setValue(
						'votedOptions',
						data.votedOptions.map(
							(_, i) => !!pollData.options.find(opt => opt.index === i)?.isVoted
						)
					)
					console.error(res.error)
				}
			} else if (pollData.type === 'rate') {
				console.log('rate', data.votedOptions)

				if (
					!(
						Array.isArray(data.votedOptions) &&
						(data.votedOptions.length > 0
							? // ? typeof data.votedOptions[0] === 'number' //todo can be undefined
							  data.votedOptions.every(
									opt => opt == undefined || typeof opt === 'number'
							  )
							: true)
					)
				) {
					console.error('Invalid voted options')
					return
				}

				const indexRatingTuples = (data.votedOptions as (number | undefined)[])
					.map((rating, index) => {
						if (rating !== undefined && (rating > 5 || rating < 1))
							throw new Error('Invalid rating')
						if (rating === undefined) return undefined
						return [index, rating] as [number, 1 | 2 | 3 | 4 | 5]
					})
					.filter(t => t !== undefined)

				if (
					!(
						Array.isArray(indexRatingTuples) &&
						(indexRatingTuples.length > 0
							? Array.isArray(indexRatingTuples[0])
							: true)
					)
				) {
					console.error('Invalid voted options')
					return
				}

				addOptimisticPollData(indexRatingTuples)
				const res = await votePollRate(
					pollData.identifier,
					indexRatingTuples,
					newOption as { label: string; rating: 1 | 2 | 3 | 4 | 5 } | undefined
				)

				console.log(res)
				if (!res) return

				if (res.success) {
					setPollData(res.payload)
				} else {
					setValue(
						'votedOptions',
						data.votedOptions.map(
							(_, i) => !!pollData.options.find(opt => opt.index === i)?.isVoted
						)
					)
					console.error(res.error)
				}
			}
		})
	}

	let OptionList: React.ReactNode

	if (pollData.type === 'multiple')
		OptionList = (
			<OptionListMultiple
				control={control}
				optimisticPollData={optimisticPollData}
				register={register}
				errors={errors}
				newOption={newOption}
				pollData={pollData}
			/>
		)
	else if (pollData.type === 'single')
		OptionList = (
			<OptionListSingle
				control={control}
				optimisticPollData={optimisticPollData}
				register={register}
				errors={errors}
				newOption={newOption}
				pollData={pollData}
				setValue={setValue}
			/>
		)
	else if (pollData.type === 'rate')
		OptionList = (
			<OptionListRate
				pollData={pollData}
				optimisticPollData={pollData}
				control={control}
				hasNewOption={newOption.has}
				setValue={setValue}
				getValues={getValues}
				expandAll={expandAll}
			/>
		)
	else OptionList = <span>Unknown poll type</span>

	return (
		<div className="max-w-screen-sm">
			<form onSubmit={handleSubmit(onSubmit)}>
				<div className="flex items-center gap-3">
					<Switch
						onCheckedChange={setExpandAll}
						checked={expandAll}
						id="expand-all-switch"
					/>
					<Label htmlFor="expand-all-switch">Expand all options</Label>
				</div>
				{OptionList}

				<Button type="submit" disabled={isSubmitting || !userIdentifier}>
					Vote
				</Button>
			</form>
		</div>
	)
}

export default PollForm

function pollOptionsToFormValue(
	type: PollData['type'],
	options: PollData['options']
) {
	if (type === 'single')
		return options.find(opt => opt.isVoted)?.index?.toString()

	if (type === 'multiple') {
		const biggestIndex = options.reduce(
			(acc, curr) => (curr.index > acc ? curr.index : acc),
			0
		)

		if (biggestIndex === 0) return []

		const valueArr: boolean[] = new Array(biggestIndex).fill(false)

		options.forEach(opt => {
			valueArr[opt.index] = !!opt.isVoted
		})

		return valueArr
	}

	if (type === 'rate') {
		const biggestIndex = options.reduce(
			(acc, curr) => (curr.index > acc ? curr.index : acc),
			0
		)

		if (biggestIndex === 0) return []

		const valueArr: (number | undefined)[] = new Array(biggestIndex)

		options.forEach(opt => {
			valueArr[opt.index] = opt.rating ?? undefined
		})

		return valueArr
	}

	return undefined
}

function OptionListSingle({
	control,
	setValue,
	optimisticPollData,
	register,
	errors,
	newOption,
	pollData,
}: {
	control: Control<any, any>
	setValue: UseFormSetValue<PollForm>
	optimisticPollData: PollData
	register: UseFormRegister<PollForm>
	errors: FieldErrors<PollForm>
	newOption: PollForm['newOption']
	pollData: PollData
}) {
	const [sortedBy, setSortedBy] = useState<'index' | 'avg'>('index')

	const sortedOptionsByAvg = useMemo(() => {
		return optimisticPollData.options.slice().sort((a, b) => {
			if (a.voteRateCount == null) {
				if (b.voteRateCount == null) {
					return 0
				}
				return -1
			}
			if (b.voteRateCount == null) {
				return -1
			}
			return b.voteRateCount - a.voteRateCount
		})
	}, [optimisticPollData.options])

	const sortedOptions = {
		index: optimisticPollData.options,
		avg: sortedOptionsByAvg,
	}
	return (
		<div>
			<Tabs
				defaultValue="index"
				className="w-[400px]"
				onValueChange={v => setSortedBy(v as 'index' | 'avg')}
			>
				<TabsList>
					<TabsTrigger value="index">Sort by index</TabsTrigger>
					<TabsTrigger value="avg">Sort by vote count</TabsTrigger>
				</TabsList>
			</Tabs>
			<RadioGroup
				control={control}
				onValueChange={v => {
					if (v === 'new-option') setValue('newOption.has', true)
					else setValue('newOption.has', false)
				}}
				name="votedOptions"
			>
				{sortedOptions[sortedBy].map((opt, i) => {
					return (
						<div key={opt.label}>
							<RadioGroupItem
								id={`poll-option-${opt.index}`}
								value={opt.index.toString()}
								className="bg-green-400"
							/>
							<Label
								htmlFor={`poll-option-${opt.index}`}
								className="cursor-pointer"
							>
								{opt.label}{' '}
								<span className="text-xs text-slate-500">
									({opt.voteRateCount} votes)
								</span>
							</Label>
						</div>
					)
				})}

				{pollData.allowNewOptions && (
					<div>
						<div className="flex flex-row">
							<RadioGroupItem
								id="poll-option-new"
								value="new-option"
								className="bg-green-400"
								disabled={
									optimisticPollData.hasCreatedOption ||
									optimisticPollData.options.length >= 100
								}
							/>

							<Input
								id="poll-new-option"
								placeholder="New option"
								className={cn({
									'border-red-400': !!errors.newOption?.optionText,
								})}
								{...register('newOption.optionText', {
									disabled:
										!newOption.has ||
										optimisticPollData.hasCreatedOption ||
										optimisticPollData.options.length >= 100,
								})}
							/>
						</div>
						{errors.newOption?.optionText && (
							<div className="text-red-400 text-xs">
								{errors.newOption.optionText.message}
							</div>
						)}
					</div>
				)}
			</RadioGroup>
		</div>
	)
}
OptionListSingle.displayName = 'OptionListSingle'

const OptionListRate = ({
	pollData,
	optimisticPollData,
	control,
	hasNewOption,
	setValue,
	getValues,
	expandAll = false,
}: {
	pollData: PollData
	optimisticPollData: PollData
	control: Control<any, any>
	hasNewOption: PollForm['newOption']['has']
	setValue: UseFormSetValue<PollForm>
	getValues: UseFormGetValues<PollForm>
	expandAll?: boolean
}) => {
	const [sortedBy, setSortedBy] = useState<'index' | 'avg'>('index')

	const sortedOptionsByAvg = useMemo(() => {
		return optimisticPollData.options.slice().sort((a, b) => {
			if (a.rateAvg == null) {
				if (b.rateAvg == null) {
					return 0
				}
				return -1
			}
			if (b.rateAvg == null) {
				return -1
			}
			return b.rateAvg - a.rateAvg
		})
	}, [optimisticPollData.options])

	const sortedOptions = {
		index: optimisticPollData.options,
		avg: sortedOptionsByAvg,
	}

	return (
		<div>
			<Tabs
				defaultValue="index"
				className="w-[400px]"
				onValueChange={v => setSortedBy(v as 'index' | 'avg')}
			>
				<TabsList>
					<TabsTrigger value="index">Sort by index</TabsTrigger>
					<TabsTrigger value="avg">Sort by average rating</TabsTrigger>
				</TabsList>
			</Tabs>
			{sortedOptions[sortedBy].map(opt => {
				return (
					<RatingOption
						key={opt.index}
						optionData={opt}
						name={`votedOptions.${opt.index}`}
						onClear={() => setValue(`votedOptions.${opt.index}`, -1)}
						control={control}
						getValues={getValues}
						rateAvg={opt.rateAvg}
						expand={expandAll}
					/>
				)
			})}

			{pollData.allowNewOptions && (
				<div>
					<Checkbox
						id="poll-option-new"
						value="new-option"
						className="grow-0"
						name="newOption.has"
						control={control}
						disabled={
							optimisticPollData.hasCreatedOption ||
							optimisticPollData.options.length >= 100
						}
					/>
					<Label htmlFor="poll-option-new">
						{hasNewOption ? 'Remove new option' : 'Add new option'}
					</Label>
					<div style={{ display: hasNewOption ? 'block' : 'none' }}>
						<RatingOption
							name="newOption"
							onClear={() => setValue('newOption.rating', null)}
							control={control}
							getValues={getValues}
							isNewOption
						/>
					</div>
				</div>
			)}
		</div>
	)
}

OptionListRate.displayName = 'OptionListRate'

function OptionListMultiple({
	control,
	optimisticPollData,
	register,
	errors,
	newOption,
	pollData,
}: {
	control: Control<any, any>
	optimisticPollData: PollData
	register: UseFormRegister<PollForm>
	errors: FieldErrors<PollForm>
	newOption: PollForm['newOption']
	pollData: PollData
}) {
	const [sortedBy, setSortedBy] = useState<'index' | 'avg'>('index')

	const sortedOptionsByAvg = useMemo(() => {
		return optimisticPollData.options.slice().sort((a, b) => {
			if (a.voteRateCount == null) {
				if (b.voteRateCount == null) {
					return 0
				}
				return -1
			}
			if (b.voteRateCount == null) {
				return -1
			}
			return b.voteRateCount - a.voteRateCount
		})
	}, [optimisticPollData.options])

	const sortedOptions = {
		index: optimisticPollData.options,
		avg: sortedOptionsByAvg,
	}
	return (
		<div>
			<Tabs
				defaultValue="index"
				className="w-[400px]"
				onValueChange={v => setSortedBy(v as 'index' | 'avg')}
			>
				<TabsList>
					<TabsTrigger value="index">Sort by index</TabsTrigger>
					<TabsTrigger value="avg">Sort by vote count</TabsTrigger>
				</TabsList>
			</Tabs>
			{sortedOptions[sortedBy].map((opt, i) => {
				return (
					<div key={opt.label}>
						<Checkbox
							id={`poll-option-${opt.index}`}
							name={`votedOptions.${opt.index}`}
							control={control}
						/>
						<Label
							htmlFor={`poll-option-${opt.index}`}
							className="cursor-pointer"
						>
							{opt.label}{' '}
							<span className="text-xs text-slate-500">
								({opt.voteRateCount} votes)
							</span>
						</Label>
					</div>
				)
			})}

			{pollData.allowNewOptions && (
				<div>
					<div className="flex flex-row">
						<Checkbox
							id="poll-option-new"
							value="new-option"
							className="grow-0"
							name="newOption.has"
							control={control}
							disabled={
								optimisticPollData.hasCreatedOption ||
								optimisticPollData.options.length >= 100
							}
						/>

						<Input
							id="poll-new-option"
							placeholder="New option"
							className={cn({
								'border-red-400': !!errors.newOption?.optionText,
							})}
							{...register('newOption.optionText', {
								disabled:
									!newOption.has ||
									optimisticPollData.hasCreatedOption ||
									optimisticPollData.options.length >= 100,
							})}
						/>
					</div>
					{errors.newOption?.optionText && (
						<div className="text-red-400 text-xs">
							{errors.newOption.optionText.message}
						</div>
					)}
				</div>
			)}
		</div>
	)
}
