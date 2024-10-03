import { NextResponse } from 'next/server'

export async function GET(request: Request) {
	console.log('>>>', request)

	return NextResponse.json({
		id: '1',
		name: 'My Poll 1',
		description: 'My Poll description 1',
		isMultiple: false,
		isClosed: true,
		timeRemaining: 0,
		voteCount: 4,
		createdAt: new Date(),
	})
}
