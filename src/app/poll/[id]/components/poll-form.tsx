'use client'

import { valibotResolver } from '@hookform/resolvers/valibot'
import React, { memo, useOptimistic, useState, useTransition } from 'react'
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
	number,
	object,
	optional,
	pipe,
	string,
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
import { votePollSingle, votePollMultiple } from '../actions'
import RatingOption from './rating-option'

const PollSchema = object({
	votedOptions: union([
		array(optional(boolean())),
		string(),
		array(
			optional(
				pipe(
					number(),
					custom<number>(n => (n as number) >= 1 || (n as number) <= 5)
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
			rating: optional(number()),
		}),
		object({
			has: literal(true),
			optionText: pipe(string(), nonEmpty("Label can't be empty")),
			rating: optional(number()),
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

	const [isPending, startTransition] = useTransition()

	const [optimisticPollData, addOptimisticPollData] = useOptimistic<
		PollData,
		number | number[]
	>(pollData, (currPollData, votedOption) => {
		if (typeof votedOption === 'number') {
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
		} else if (Array.isArray(votedOption)) {
			return {
				...currPollData,
				options: currPollData.options.map(opt => {
					if (votedOption.includes(opt.index)) {
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
		formState: { isSubmitting, isSubmitted, errors },
	} = useForm<PollForm>({
		resolver: valibotResolver(PollSchema),
		defaultValues: {
			votedOptions:
				pollData.type === 'multiple'
					? pollOptionsToFormValue(pollData.options)
					: pollData.options.find(opt => opt.isVoted)?.index?.toString(),
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
	// console.log(pollData)
	// const votedOption = watch(
	// 	pollData.type === 'multiple' ? 'votedOptions' : 'votedOptions'
	// )
	const newOption = watch('newOption')

	async function onSubmit(data: PollForm) {
		console.log(data)

		startTransition(async () => {
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
				const res = await votePollSingle(pollData.identifier, votedOptionIndex)

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
					votedOptionIndexes
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
			/>
		)
	else OptionList = <span>Unknown poll type</span>

	return (
		<div>
			<form onSubmit={handleSubmit(onSubmit)}>
				{OptionList}

				<Button type="submit" disabled={isSubmitting || !userIdentifier}>
					Vote
				</Button>
			</form>
		</div>
	)
}

export default PollForm

function pollOptionsToFormValue(options: PollData['options']) {
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
	return (
		<RadioGroup
			control={control}
			onValueChange={v => {
				if (v === 'new-option') setValue('newOption.has', true)
				else setValue('newOption.has', false)
			}}
			name="votedOptions"
		>
			{optimisticPollData.options.map((opt, i) => {
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
}: {
	pollData: PollData
	optimisticPollData: PollData
	control: Control<any, any>
	hasNewOption: PollForm['newOption']['has']
	setValue: UseFormSetValue<PollForm>
	getValues: UseFormGetValues<PollForm>
}) => {
	return (
		<div>
			{optimisticPollData.options.map(opt => {
				return (
					<RatingOption
						key={opt.index}
						optionData={opt}
						name={`votedOptions.${opt.index}`}
						onClear={() => setValue(`votedOptions.${opt.index}`, undefined)}
						control={control}
						getValues={getValues}
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
							onClear={() => setValue('newOption.rating', undefined)}
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
	return (
		<>
			{optimisticPollData.options.map((opt, i) => {
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
		</>
	)
}
