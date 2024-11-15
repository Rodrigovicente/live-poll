import React, { forwardRef } from 'react'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from './select'
import { SelectProps } from '@radix-ui/react-select'
import { Control, Controller } from 'react-hook-form'

export interface SelectFieldProps extends SelectProps {
	options: {
		value: string
		label: string
	}[]
	placeholder?: string
	className?: string
	onBlur?: () => void
	id?: string
}

const SelectField = ({
	control,
	value,
	onValueChange,
	disabled,
	onBlur,
	...props
}: SelectFieldProps & { control?: Control<any, any> }) => {
	if (control !== undefined) {
		return (
			<Controller
				control={control}
				name={props.name ?? ''}
				render={({
					field: { onChange, value, disabled, onBlur, ...field },
				}) => (
					<SelectFieldUncontrolled
						{...props}
						{...field}
						value={value}
						onValueChange={v => {
							onValueChange && onValueChange(v)
							return onChange(v)
						}}
						onBlur={onBlur}
						disabled={disabled}
					/>
				)}
			/>
		)
	}
	return (
		<SelectFieldUncontrolled
			{...props}
			value={value}
			onValueChange={onValueChange}
			disabled={disabled}
			onBlur={onBlur}
		/>
	)
}

export default SelectField

const SelectFieldUncontrolled = forwardRef<HTMLButtonElement, SelectFieldProps>(
	(
		{
			options,
			placeholder = 'Select',
			className,
			onBlur,
			id,
			...props
		}: SelectFieldProps,
		ref
	) => {
		return (
			<Select {...props}>
				<SelectTrigger className={className} onBlur={onBlur} ref={ref} id={id}>
					<SelectValue placeholder={placeholder} />
				</SelectTrigger>
				<SelectContent>
					{options.length > 0 ? (
						options.map(option => (
							<SelectItem key={option.value} value={option.value}>
								{option.label}
							</SelectItem>
						))
					) : (
						<div className="w-full text-center text-sm italic text-muted-foreground">
							No options
						</div>
					)}
				</SelectContent>
			</Select>
		)
	}
)

SelectFieldUncontrolled.displayName = 'SelectFieldUncontrolled'
