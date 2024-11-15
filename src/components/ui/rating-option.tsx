import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import React, { memo, use, useEffect, useRef } from 'react'
import { Control, Controller } from 'react-hook-form'
import { PollData } from '../../app/poll/[id]/page'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { StarFilledIcon } from '@radix-ui/react-icons'
import s from './rating-option.module.css'
import Image from 'next/image'
import { Progress } from './progress'
import ExpandableText from './expandable-text'

type NewRatingOptionProps = {
	control: Control<any, any>
	name: string
	optionData?: never
	onValueChange?: (value: string) => void
	onClear?: () => void
	getValues?: (name: string) => any
	isNewOption: true
	rateAvg?: never
	expand?: boolean
}

type ExistingRatingOptionProps = {
	control: Control<any, any>
	name: string
	optionData: PollData['options'][0]
	onValueChange?: (value: string) => void
	onClear?: () => void
	getValues?: (name: string) => any
	isNewOption?: false
	rateAvg: number | null
	expand?: boolean
}

type RatingOptionProps = NewRatingOptionProps | ExistingRatingOptionProps

type RatingValue = 1 | 2 | 3 | 4 | 5
const ratingValues: RatingValue[] = [5, 4, 3, 2, 1]

const RatingOption = ({
	control,
	name,
	optionData,
	onValueChange,
	onClear,
	getValues,
	isNewOption,
	rateAvg,
	expand = true,
}: RatingOptionProps) => {
	const error = control.getFieldState(`newOption.optionText`).error
	const newOptionRatingError = control.getFieldState(`newOption.rating`).error
	const newOptionRating = getValues?.(`newOption.rating`)

	const avgPercent = rateAvg ? (rateAvg / 5) * 100 : null
	rateAvg = rateAvg ? Number(rateAvg.toFixed(2)) : null

	const starsContainerRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		console.log('newOptionRatingState', newOptionRating)
		let timeout: NodeJS.Timeout
		if (isNewOption && !newOptionRating) {
			starsContainerRef.current?.style.setProperty(
				'animation',
				'horizontal-shaking 0.3s ease-in-out'
			)
			timeout = setTimeout(() => {
				starsContainerRef.current?.style.setProperty('animation', '')
			}, 300)
		}

		return () => {
			if (timeout) clearTimeout(timeout)
		}
	}, [newOptionRating, isNewOption, newOptionRatingError])

	return (
		<div className="relative px-5 py-2 m-2 min-w-96 w-full rounded-lg bg-slate-800 overflow-hidden">
			<div
				className="absolute w-0 h-full top-0 left-0 bg-slate-100/5"
				style={{ width: `${avgPercent}%` }}
			></div>
			<div className="w-full h-full top-0 left-0 relative">
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
						{error && (
							<div className="text-red-400 text-xs">{error.message}</div>
						)}
					</div>
				) : (
					<ExpandableText minLines={2} open={expand}>
						{optionData!.label}
					</ExpandableText>
				)}
				<div className="flex justify-between items-center gap-3">
					<span className="text-xs text-slate-500">
						({optionData?.voteRateCount} votes)
					</span>
					<div className={s.starsContainer} ref={starsContainerRef}>
						<Controller
							control={control}
							name={`${name}${isNewOption ? '.rating' : ''}`}
							render={({ field }) => {
								return (
									<>
										{ratingValues.map((rate, i) => {
											return (
												<RatingStar
													key={rate}
													value={rate}
													currRating={field.value}
													onClick={() => {
														field.onChange(rate)
													}}
													onBlur={field.onBlur}
													disabled={field.disabled}
													onClear={onClear}
												/>
											)
										})}
									</>
								)
							}}
						/>
					</div>
				</div>

				{/* {avgPercent !== null && (
					<div className="mt-3">
						<Progress value={avgPercent} />
						{rateAvg}
					</div>
				)} */}
			</div>
		</div>
	)
}

RatingOption.displayName = 'RatingOption'

function RatingStar({
	value,
	currRating,
	onClick,
	onBlur,
	onClear,
	disabled,
}: {
	value: RatingValue | undefined
	currRating: RatingValue
	onClick: () => void
	onBlur: () => void
	onClear?: () => void
	disabled?: boolean
}) {
	// let starIcon
	// if (value <= currRating) starIcon = <StarFilledIcon width={18} height={18} />
	// else starIcon = <StarIcon width={18} height={18} />

	if (!(ratingValues as any).includes(value)) {
		value = undefined
	}

	const isActive = value === currRating

	function handleClick() {
		onClick()

		if (isActive) onClear?.()
	}

	return (
		<button
			type="button"
			className={cn(s.starBtn, isActive ? s.active : null)}
			onClick={handleClick}
			onBlur={onBlur}
			disabled={disabled}
		>
			<StarIcon />
		</button>
	)
}

RatingStar.displayName = 'RatingStar'

function StarIcon({
	size = 18,
	strokeWidth = 12,
}: {
	size?: number
	strokeWidth?: number
}) {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 128 122.43"
			paintOrder="fill stroke markers"
			width={size}
			height={size}
			className={s.starIcon}
		>
			<defs>
				<path
					id="path"
					d="M70.35,4,86.29,36.24l35.64,5.18a7.08,7.08,0,0,1,3.92,12.08L100.07,78.64l6.08,35.49a7.08,7.08,0,0,1-10.28,7.47L64,104.84,32.13,121.6a7.08,7.08,0,0,1-10.28-7.47l6.08-35.49L2.15,53.5A7.08,7.08,0,0,1,6.07,41.42l35.64-5.18L57.65,4A7.08,7.08,0,0,1,70.35,4Z"
				/>
				<clipPath id="clip">
					<use xlinkHref="#path" />
				</clipPath>
			</defs>
			<g>
				<use
					xlinkHref="#path"
					clipPath="url(#clip)"
					stroke="currentColor"
					strokeWidth={strokeWidth * 2}
				/>
			</g>
		</svg>
	)
}

export default memo(RatingOption)
