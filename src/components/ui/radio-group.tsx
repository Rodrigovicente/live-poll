'use client'

import * as React from 'react'
import { CheckIcon } from '@radix-ui/react-icons'
import * as RadioGroupPrimitive from '@radix-ui/react-radio-group'

import { cn } from '@/lib/utils'
import { Control, Controller } from 'react-hook-form'

type RadioGroupProps = {
	control?: Control<any, any>
	onValueChange?: (value: string) => void
	parseValue?: (value: string) => any
	onRenderValueChange?: (v: any) => void
}

const RadioGroup = React.forwardRef<
	React.ElementRef<typeof RadioGroupPrimitive.Root> & RadioGroupProps,
	React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root> &
		RadioGroupProps
>(({ className, parseValue, onRenderValueChange, ...props }, ref) => {
	if (props.control !== undefined)
		return (
			<Controller
				control={props.control}
				name={props.name ?? ''}
				render={({ field }) => {
					// console.log('field', field.value)
					onRenderValueChange?.(field.value)
					return (
						<RadioGroupPrimitive.Root
							className={cn('grid gap-2', className)}
							{...props}
							disabled={props.disabled || field.disabled}
							onValueChange={v => {
								props.onValueChange?.(v)
								return field.onChange(parseValue ? parseValue(v) : v)
							}}
							value={field.value?.toString() ?? ''}
							ref={ref}
						/>
					)
				}}
			/>
		)

	return (
		<RadioGroupPrimitive.Root
			className={cn('grid gap-2', className)}
			{...props}
			ref={ref}
		/>
	)
})
RadioGroup.displayName = RadioGroupPrimitive.Root.displayName

type RadioGroupItemProps = object

const RadioGroupItem = React.forwardRef<
	React.ElementRef<typeof RadioGroupPrimitive.Item> & RadioGroupItemProps,
	React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item> &
		RadioGroupItemProps
>(({ className, ...props }, ref) => {
	return (
		<RadioGroupPrimitive.Item
			ref={ref}
			className={cn(
				'aspect-square h-4 w-4 rounded-full border border-primary text-primary shadow focus:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
				className
			)}
			{...props}
		>
			<RadioGroupPrimitive.Indicator className="flex items-center justify-center">
				<CheckIcon className="h-3.5 w-3.5 fill-primary" />
			</RadioGroupPrimitive.Indicator>
		</RadioGroupPrimitive.Item>
	)
})
RadioGroupItem.displayName = RadioGroupPrimitive.Item.displayName

export { RadioGroup, RadioGroupItem }
