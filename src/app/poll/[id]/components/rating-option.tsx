import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import React, { memo, useRef } from 'react'
import { Control } from 'react-hook-form'
import { PollData } from '../page'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

type NewRatingOptionProps = {
	control: Control<any, any>
	name: string
	optionData?: never
	onValueChange?: (value: string) => void
	onClear?: () => void
	getValues?: (name: string) => any
	isNewOption: true
}

type ExistingRatingOptionProps = {
	control: Control<any, any>
	name: string
	optionData: PollData['options'][0]
	onValueChange?: (value: string) => void
	onClear?: () => void
	getValues?: (name: string) => any
	isNewOption?: false
}

type RatingOptionProps = NewRatingOptionProps | ExistingRatingOptionProps

const RatingOption = ({
	control,
	name,
	optionData,
	onValueChange,
	onClear,
	getValues,
	isNewOption,
}: RatingOptionProps) => {
	const ratings = useRef([1, 2, 3, 4, 5])

	const idName = isNewOption ? 'newOption' : optionData.index

	const error = control.getFieldState(`newOption.optionText`).error

	//CLEAR RATE ON CLICK ON ALREADY SELECTED RATING
	function handleItemClick(rate: number) {
		if (
			onClear &&
			rate === getValues?.(`${name}${isNewOption ? '.rating' : ''}`)
		) {
			console.log(
				'clearing',
				rate,
				getValues?.(`${name}${isNewOption ? '.rating' : ''}`)
			)
			onClear()
		}
	}

	return (
		<div className="px-5 py-2 m-2 w-fit rounded-lg bg-slate-200/10 ">
			{isNewOption ? (
				<div className="flex flex-col">
					<Input
						id="poll-new-option"
						placeholder="New option label"
						className={cn({
							'border-red-400': !!error,
						})}
						control={control}
						name={`${name}.optionText`}
					/>
					{error && <div className="text-red-400 text-xs">{error.message}</div>}
				</div>
			) : (
				<>
					{optionData.label}{' '}
					<span className="text-xs text-slate-500">
						({optionData.voteRateCount} votes)
					</span>
				</>
			)}
			<RadioGroup
				control={control}
				parseValue={v => parseInt(v)}
				onValueChange={v => {
					return onValueChange?.(v)
				}}
				// onRenderValueChange={v => {
				// 	console.log('test', v)
				// 	setIsRated(v !== undefined)
				// }}
				name={`${name}${isNewOption ? '.rating' : ''}`}
				className="flex flex-row flex-nowrap gap-2"
			>
				{ratings.current.map((rate, i) => {
					return (
						<div key={rate}>
							<RadioGroupItem
								id={`poll-option-${idName}-rate-${rate}`}
								value={rate.toString()}
								className="bg-green-400"
								onClick={() => handleItemClick(rate)}
							/>
							<Label
								htmlFor={`poll-option-${idName}-rate-${rate}`}
								className="cursor-pointer"
							>
								{rate}
							</Label>
						</div>
					)
				})}
				{/* {onClear && (
					<Button variant="ghost" className="p-0 w-5 h-5" onClick={onClear}>
						<XIcon size={16} />
					</Button>
				)} */}
			</RadioGroup>
		</div>
	)
}

export default memo(RatingOption)
