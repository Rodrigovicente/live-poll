'use client'

import * as React from 'react'
import { CheckIcon } from '@radix-ui/react-icons'
import * as RadioGroupPrimitive from '@radix-ui/react-radio-group'

import { cn } from '@/lib/utils'
import { Control, Controller } from 'react-hook-form'

const RadioGroup = React.forwardRef<
	React.ElementRef<typeof RadioGroupPrimitive.Root> & {
		control?: Control<any, any>
	},
	React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root> & {
		control?: Control<any, any>
	}
>(({ className, ...props }, ref) => {
	if (props.control !== undefined)
		return (
			<Controller
				control={props.control}
				name={props.name ?? ''}
				render={({ field }) => (
					<RadioGroupPrimitive.Root
						className={cn('grid gap-2', className)}
						{...props}
						onValueChange={field.onChange}
						value={field.value}
						ref={ref}
					/>
				)}
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

const RadioGroupItem = React.forwardRef<
	React.ElementRef<typeof RadioGroupPrimitive.Item>,
	React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>
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
