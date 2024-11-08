import * as React from 'react'

import { cn } from '@/lib/utils'
import { Control, Controller } from 'react-hook-form'

interface InputPropsUncontrolled
	extends React.InputHTMLAttributes<HTMLInputElement> {
	control?: never
	name?: string
}

interface InputPropsControlled
	extends React.InputHTMLAttributes<HTMLInputElement> {
	control: Control<any, any>
	name: string
}

export type InputProps = InputPropsUncontrolled | InputPropsControlled

const Input = React.forwardRef<HTMLInputElement, InputProps>(
	({ className, type, control, ...props }, ref) => {
		if (control)
			return (
				<Controller
					control={control}
					name={props.name ?? ''}
					render={({ field }) => (
						<input
							type={type}
							className={cn(
								'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
								className
							)}
							ref={r => {
								field.ref(r)
								if (typeof ref === 'function') {
									ref(r)
								} else if (ref !== null) {
									ref.current = r
								}
							}}
							{...props}
							onChange={e => {
								props.onChange?.(e)
								return field.onChange(e)
							}}
							onBlur={e => {
								props.onBlur?.(e)
								return field.onBlur()
							}}
							value={field.value}
							disabled={props.disabled || field.disabled}
						/>
					)}
				/>
			)

		return (
			<input
				type={type}
				className={cn(
					'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
					className
				)}
				ref={ref}
				{...props}
			/>
		)
	}
)
Input.displayName = 'Input'

export { Input }
