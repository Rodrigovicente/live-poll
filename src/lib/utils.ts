import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { customAlphabet } from 'nanoid'

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs))
}

export function minToDays(min: number) {
	if (min <= 0) return '0m'

	const days = Math.floor(min / 1440)
	const remainingTime = min - Math.floor(days * 1440)
	const hours = Math.floor(remainingTime / 60)
	const remainingMin = Math.floor(remainingTime - hours * 60)

	const daysStringArr = []
	if (days > 0) daysStringArr.push(days + 'd')
	if (hours > 0) daysStringArr.push(hours + 'h')
	if (remainingMin > 0) daysStringArr.push(remainingMin + 'm')

	return daysStringArr.join(' ')
}

export const nanoid = customAlphabet(
	'0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
	21
)

export function secToHours(sec: number) {
	if (sec <= 0) return '0s'

	const hours = Math.floor(sec / 3600)
	const remainingSec = sec - Math.floor(hours * 3600)
	const min = Math.floor(remainingSec / 60)
	const secFinal = remainingSec - Math.floor(min * 60)

	const daysStringArr = []
	if (hours > 0) daysStringArr.push((hours + 'h').padStart(3, '0'))
	if (min > 0) daysStringArr.push((min + 'm').padStart(3, '0'))
	daysStringArr.push((secFinal + 's').padStart(3, '0'))

	return daysStringArr.join(' ')
}
