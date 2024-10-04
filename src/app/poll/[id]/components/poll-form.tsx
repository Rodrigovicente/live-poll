'use client'

import { valibotResolver } from '@hookform/resolvers/valibot'
import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import {
	array,
	boolean,
	InferInput,
	nonEmpty,
	object,
	optional,
	pipe,
	string,
	union,
} from 'valibot'
import { PollData } from '../page'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { votePoll } from '../actions'

const PollSchema = object({
	votedOptions: union([array(boolean()), string()]),
	newOption: optional(
		object({
			optionText: pipe(string(), nonEmpty("Option text can't be empty")),
		})
	),
})

export type PollForm = InferInput<typeof PollSchema>

export function PollForm({ pollData }: { pollData: PollData }) {
	const {
		register,
		control,
		handleSubmit,
		watch,
		setValue,
		getValues,
		formState: { errors },
	} = useForm<PollForm>({
		resolver: valibotResolver(PollSchema),
		defaultValues: {
			votedOptions: pollData.isMultiple
				? pollData.options.map(opt => {
						return !!opt.isVoted
				  })
				: pollData.options.findIndex(opt => opt.isVoted)?.toString(),
		},
	})

	const votedOption = watch('votedOptions')

	const [hasNewOption, setHasNewOption] = useState(false)

	async function onSubmit(data: PollForm) {
		console.log(data)

		const res = await votePoll(pollData.identifier, data)

		console.log(res)
	}

	let OptionList: React.ReactNode

	if (pollData.isMultiple)
		OptionList = (
			<>
				{pollData.options.map((opt, i) => {
					return (
						<div key={opt.text}>
							<Checkbox
								id={`poll-option-${i}`}
								name={`votedOptions.${i}`}
								control={control}
							/>
							<Label htmlFor={`poll-option-${i}`} className="cursor-pointer">
								{opt.text} <span>({opt.voteCount} votes)</span>
							</Label>
						</div>
					)
				})}
			</>
		)
	else
		OptionList = (
			<RadioGroup control={control} name="votedOptions">
				{pollData.options.map((opt, i) => {
					return (
						<div key={opt.text}>
							<RadioGroupItem
								id={`poll-option-${i}`}
								value={i.toString()}
								className="bg-green-400"
							/>
							<Label htmlFor={`poll-option-${i}`} className="cursor-pointer">
								{opt.text}{' '}
								<span className="text-xs text-slate-500">
									({opt.voteCount} votes)
								</span>
							</Label>
						</div>
					)
				})}

				{pollData.allowNewOptions && (
					<div>
						<RadioGroupItem
							id={`poll-option-new`}
							value={'new-option'}
							className="bg-green-400"
						/>
						<Label htmlFor={`poll-option-new`} className="cursor-pointer">
							Add a new option
						</Label>
					</div>
				)}
			</RadioGroup>
		)

	return (
		<div>
			<form onSubmit={handleSubmit(onSubmit)}>
				{OptionList}

				{(votedOption === 'new-option' ||
					(pollData.isMultiple && pollData.allowNewOptions)) && (
					<div>
						<div className="flex flex-row">
							{pollData.isMultiple && (
								<Checkbox
									className="grow-0"
									onCheckedChange={v => setHasNewOption(!!v)}
								/>
							)}

							<Input
								id="poll-new-option"
								placeholder="New option"
								className={cn({
									'border-red-400': !!errors.newOption?.optionText,
								})}
								disabled={!hasNewOption && pollData.isMultiple}
								{...register('newOption.optionText')}
							/>
						</div>
						{errors.newOption?.optionText && (
							<div className="text-red-400 text-xs">
								{errors.newOption.optionText.message}
							</div>
						)}
					</div>
				)}

				<Button type="submit">Vote</Button>
			</form>
		</div>
	)
}

export default PollForm
