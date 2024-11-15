export function getFormattedPollType(type: string) {
	if (type === 'single') return 'Single Choice'
	if (type === 'multiple') return 'Multiple Choice'
	if (type === 'rate') return 'Rating'
	else return null
}
