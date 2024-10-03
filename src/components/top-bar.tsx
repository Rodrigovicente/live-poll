'use client'
import { useSession, signIn, signOut } from 'next-auth/react'
import { Button } from './ui/button'

export default function TopBar() {
	const { data: session } = useSession()

	const content = session ? <LoggedIn /> : <LoggedOut />
	return (
		<div className="w-full flex flex-col items-center space-y-2">
			<p className="text-2xl">LivePoll</p>
			{content}
		</div>
	)
}

function LoggedIn() {
	return (
		<>
			<p className="text-2xl">Logged in</p>
			<Button onClick={() => signOut()}>Sign out</Button>
		</>
	)
}

function LoggedOut() {
	return (
		<>
			<p className="text-2xl">Logged out</p>
			<Button onClick={() => signIn()}>Sign in</Button>
		</>
	)
}
