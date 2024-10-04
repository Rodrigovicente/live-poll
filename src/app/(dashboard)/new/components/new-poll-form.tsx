'use client'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { cn, minToDays } from '@/lib/utils'
import { valibotResolver } from '@hookform/resolvers/valibot'
import { Label } from '@radix-ui/react-label'
import { XIcon } from 'lucide-react'
import React, {
	ChangeEvent,
	useCallback,
	useEffect,
	useRef,
	useState,
} from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import {
	array,
	boolean,
	InferInput,
	maxLength,
	maxValue,
	minValue,
	nonEmpty,
	object,
	optional,
	pipe,
	string,
	transform,
	unknown,
} from 'valibot'
import { createNewPoll } from './actions'
import { DialogComponent } from '@/components/ui/dialog'
import PollCreated from './poll-created'
import { CreatePollParams } from '@/lib/db/queries/poll'

const MAX_OPT_COUNT = 100

const NewPollSchema = object({
	title: pipe(
		string(),
		nonEmpty('Name is required'),
		maxLength(100, "Name can't be longer than 100 characters")
	),
	description: optional(string()),
	isMultiple: optional(boolean(), false),
	allowNewOptions: optional(boolean(), false),
	requireTwitchAccount: optional(boolean(), false),
	requireGoogleAccount: optional(boolean(), false),
	requireTwitchSub: optional(boolean(), false),
	votingTimeLimit: optional(
		pipe(
			unknown(),
			transform(Number),
			minValue(1, 'Must be at least 1 minute'),
			maxValue(43200, `Can't be longer than 30 days`)
		)
	),
	options: array(
		object({
			optionText: pipe(string(), nonEmpty("Option text can't be empty")),
		})
	),
})

export type NewPollForm = InferInput<typeof NewPollSchema>

function NewPollForm() {
	const {
		register,
		control,
		handleSubmit,
		watch,
		setError,
		clearErrors,
		setValue,
		getValues,
		formState: { errors, isSubmitting, isSubmitted, ...formState },
	} = useForm<NewPollForm>({
		resolver: valibotResolver(NewPollSchema),
		defaultValues: {
			votingTimeLimit: 30,
			isMultiple: false,
			allowNewOptions: false,
			requireTwitchAccount: false,
			requireGoogleAccount: false,
			requireTwitchSub: false,
			options: [{ optionText: '' }, { optionText: '' }],
		},
	})

	const {
		fields: optionFields,
		append,
		remove,
	} = useFieldArray({
		control,
		name: 'options',
	})

	const votingTime = watch('votingTimeLimit', 30)

	const requireTwitchAccount = watch('requireTwitchAccount', false)
	// const optionList = watch('options', [])

	const timeChangeTimeout = useRef<ReturnType<typeof setTimeout>>(null!)

	const [dialogData, setDialogData] = useState<{
		title: string
		description?: string
		content: React.ReactNode
		footer?: React.ReactNode
		isOpen: boolean
	} | null>(null)

	const [isCreated, setIsCreated] = useState(false)

	function setOpenDialog(open?: boolean) {
		setDialogData(prev => {
			if (prev === null) return null

			return {
				...prev,
				isOpen: open ?? !prev?.isOpen,
			}
		})
	}

	useEffect(() => {
		console.log(timeChangeTimeout.current)
		function cancelTimeChange() {
			clearTimeout(timeChangeTimeout.current)
		}

		document.body.addEventListener('pointerup', cancelTimeChange)

		return () => {
			document.body.removeEventListener('pointerup', cancelTimeChange)
		}
	}, [])

	async function onSubmit(data: NewPollForm) {
		console.log(data)
		console.log(
			'stringify onSubmit',
			JSON.stringify(getValues('options.1.optionText'))
		)

		if (validateOptions(data.options)) return

		console.log(errors)

		const endsAt = new Date(
			new Date().getTime() + Number(data.votingTimeLimit) * 60 * 1000
		)

		const newPollData: CreatePollParams = {
			title: data.title,
			options: data.options,
			description: data.description ?? '',
			isMultiple: data.isMultiple ?? false,
			allowNewOptions: data.allowNewOptions ?? false,
			requireTwitchAccount: data.requireTwitchAccount ?? false,
			requireGoogleAccount: data.requireGoogleAccount ?? false,
			requireTwitchSub:
				(data.requireTwitchSub ?? false) &&
				(data.requireTwitchAccount ?? false),
			endsAt: endsAt,
		}

		const res = await createNewPoll(newPollData)

		if (res.success) {
			setIsCreated(true)
		} else {
			setDialogData({
				title: 'There was a problem',
				description: 'Poll was not created',
				content: res.error?.message,
				isOpen: true,
			})
		}

		console.log(res)
	}

	function addOption() {
		// setOptionList([...optionList, ''])
		if (optionFields.length < MAX_OPT_COUNT) append({ optionText: '' })
	}

	// function validateOption(text: string, index: number) {
	// 	optionList.forEach((opt, i) => {
	// 		if (i !== index) {
	// 			if (opt.optionText === text) {
	// 				setError(`options.${index}.optionText`, {
	// 					type: 'repeatedOption',
	// 					message: 'Option already exists',
	// 				})
	// 				setError(`options.${i}.optionText`, {
	// 					type: 'repeatedOption',
	// 					message: 'Option already exists',
	// 				})
	// 			} else {
	// 				clearErrors(`options.${index}.optionText`)
	// 			}
	// 		}
	// 	})

	// console.log(inputName, '-->', isInvalid, optionList)
	// if (isInvalid)
	// 	setError(inputName, {
	// 		type: 'repeatedOption',
	// 		message: 'Option already exists',
	// 	})
	// else clearErrors(inputName)
	// console.debug(errors)
	// }

	const validateOptions = useCallback(
		(
			optionList: NewPollForm['options'] | null,
			text?: string,
			index?: number
		): boolean => {
			if (!optionList) optionList = getValues('options')
			console.log('stringify>', JSON.stringify(optionList))

			const invalidIndexList = new Array(optionList.length).fill(false)

			let hasError = false

			for (let i = 0; i < optionList.length; i++) {
				if (invalidIndexList[i] === true) continue

				let hasError_i = false

				const optText_i = i === index ? text : optionList[i].optionText

				for (let j = i + 1; j < optionList.length; j++) {
					const optText_j = j === index ? text : optionList[j].optionText

					if (optText_i === optText_j) {
						hasError_i = true
						hasError = true
						setError(`options.${i}.optionText`, {
							type: 'repeatedOption',
							message: 'Option already exists',
						})

						// if (optionList[j] !== undefined)
						setError(`options.${j}.optionText`, {
							type: 'repeatedOption',
							message: 'Option already exists',
						})

						invalidIndexList[j] = true
						console.log('invalidIndexList', invalidIndexList)
						// break
					}
				}

				if (index != undefined && !hasError_i)
					clearErrors(`options.${i}.optionText`)
			}

			if (hasError) {
				setError(`options`, {
					type: 'repeatedOption',
					message: 'Option already exists',
				})
			} else {
				clearErrors(`options`)
			}

			return hasError
			// console.debug(errors)
		},
		[setError, clearErrors, getValues]
	)

	function removeOption(index: number) {
		// setOptionList(optionList.filter((_, i) => i !== index))
		if (optionFields.length > 2) {
			remove(index)
			requestAnimationFrame(() => validateOptions(null))
		}
	}

	function timeAddMinutes(minutes: number, runCount?: number) {
		const value = Number(getValues('votingTimeLimit')) + minutes
		setValue('votingTimeLimit', value < 1 ? 1 : value)

		if (runCount !== undefined) {
			timeChangeTimeout.current = setTimeout(
				() => {
					timeAddMinutes(minutes, ++runCount!)
				},
				runCount < 5 ? 400 : 100
			)
		}
	}

	if (optionFields.length < 2) return null

	if (isCreated) return <PollCreated />

	return (
		<div>
			<form onSubmit={handleSubmit(onSubmit)} noValidate>
				<div>
					<Label htmlFor="poll-name">Name</Label>
					<Input
						id="poll-name"
						placeholder="Name"
						className={cn({
							'border-red-400': !!errors.title,
						})}
						{...register('title', {
							disabled: isSubmitting,
						})}
					/>
					{errors.title && (
						<div className="text-red-400 text-xs">{errors.title.message}</div>
					)}
				</div>
				<div>
					<Label htmlFor="poll-description">
						Description{' '}
						<span className="text-xs text-slate-400">(optional)</span>
					</Label>
					<Textarea
						id="poll-description"
						placeholder="Description"
						{...register('description', {
							disabled: isSubmitting,
						})}
					/>
				</div>
				<div>
					<Label htmlFor="poll-name">Voting time limit (in minutes)</Label>

					<div className="relative">
						<Input
							id="poll-time-limit"
							placeholder="Time limit"
							type="number"
							min={1}
							max={60 * 24 * 30}
							className={cn({
								'border-red-400': !!errors.votingTimeLimit,
							})}
							{...register('votingTimeLimit', {
								disabled: isSubmitting,
							})}
						/>
						<span className="absolute top-2 right-10 text-slate-400 text-sm">
							({minToDays(Number(votingTime))})
						</span>
					</div>
					{errors.votingTimeLimit && (
						<div className="text-red-400 text-xs">
							{errors.votingTimeLimit?.message}
						</div>
					)}
					<Button type="button" onClick={() => timeAddMinutes(-1440)}>
						-1 day
					</Button>
					<Button type="button" onClick={() => timeAddMinutes(-60)}>
						-1 hour
					</Button>
					<Button type="button" onPointerDown={() => timeAddMinutes(-1, 0)}>
						-
					</Button>
					<Button type="button" onPointerDown={() => timeAddMinutes(1, 0)}>
						+
					</Button>
					<Button type="button" onClick={() => timeAddMinutes(60)}>
						+1 hour
					</Button>
					<Button type="button" onClick={() => timeAddMinutes(1440)}>
						+1 day
					</Button>
				</div>

				<div>
					<Checkbox
						id="poll-multiple"
						name="isMultiple"
						control={control}
						disabled={isSubmitting}
					/>
					<Label htmlFor="poll-multiple">Multiple</Label>
					{errors.isMultiple && (
						<div className="text-red-400 text-xs">
							{errors.isMultiple.message}
						</div>
					)}
				</div>

				<div>
					<Checkbox
						id="poll-allow-new-options"
						name="allowNewOptions"
						control={control}
						disabled={isSubmitting}
					/>
					<Label htmlFor="poll-allow-new-options">
						Allow voters to add new options
					</Label>
					{errors.allowNewOptions && (
						<div className="text-red-400 text-xs">
							{errors.allowNewOptions.message}
						</div>
					)}
				</div>

				<div>
					<Checkbox
						id="poll-require-twitch-account"
						name="requireTwitchAccount"
						control={control}
						disabled={isSubmitting}
					/>
					<Label htmlFor="poll-require-twitch-account">
						Require Twitch account
					</Label>
					{errors.requireTwitchAccount && (
						<div className="text-red-400 text-xs">
							{errors.requireTwitchAccount.message}
						</div>
					)}
				</div>

				<div style={{ display: requireTwitchAccount ? 'block' : 'none' }}>
					<Checkbox
						id="poll-require-twitch-sub"
						name="requireTwitchSub"
						control={control}
						disabled={isSubmitting || !requireTwitchAccount}
					/>
					<Label htmlFor="poll-require-twitch-sub">
						Require Twitch subscription
					</Label>
					{errors.requireTwitchSub && (
						<div className="text-red-400 text-xs">
							{errors.requireTwitchSub.message}
						</div>
					)}
				</div>

				<div>
					<Checkbox
						id="poll-require-google-account"
						name="requireGoogleAccount"
						control={control}
						disabled={isSubmitting}
					/>
					<Label htmlFor="poll-require-google-account">
						Require Google account
					</Label>
					{errors.requireGoogleAccount && (
						<div className="text-red-400 text-xs">
							{errors.requireGoogleAccount.message}
						</div>
					)}
				</div>

				{errors.options && (
					<div className="text-red-400 text-xs">{errors.options.message}</div>
				)}
				<ul>
					{optionFields.map((field, index) => (
						<li key={field.id} className="flex my-2 gap-2 items-center">
							<Label htmlFor={`poll-option-${index}`} className="w-5 text-xs">
								{index + 1}
							</Label>
							<Input
								id={`poll-option-${index}`}
								placeholder={'Option ' + (index + 1)}
								className={cn({
									'border-red-400': !!errors.options?.[index]?.optionText,
								})}
								{...(() => {
									const { onChange, ...rest } = register(
										`options.${index}.optionText` as const,
										{
											disabled: isSubmitting,
										}
									)

									const newOnChange = (e: ChangeEvent<HTMLInputElement>) => {
										// console.log(e.target.value)
										// validateOption(e.target.value, index)
										validateOptions(null, e.target.value, index)
										onChange(e)
									}
									return {
										onChange: newOnChange,
										...rest,
									}
								})()}
							/>
							<Button
								onClick={() => removeOption(index)}
								disabled={optionFields.length <= 2}
								className="w-8 h-8 p-1 shrink-0"
							>
								<XIcon />
							</Button>
						</li>
					))}
				</ul>
				<Button
					type="button"
					onClick={addOption}
					disabled={optionFields.length >= MAX_OPT_COUNT}
				>
					Add option
				</Button>
				<Button type="submit">Submit</Button>
			</form>
			{dialogData && (
				<DialogComponent
					title={dialogData.title}
					description={dialogData.description}
					open={dialogData.isOpen}
					footer={dialogData.footer}
					onOpenChange={setOpenDialog}
				>
					{dialogData.content}
				</DialogComponent>
			)}
		</div>
	)
}

export default NewPollForm
