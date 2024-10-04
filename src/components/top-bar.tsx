'use client'
import { useSession, signIn, signOut } from 'next-auth/react'
import { Button } from './ui/button'
import { Session } from 'next-auth'
import Image from 'next/image'
import { HomeIcon, SettingsIcon } from 'lucide-react'
import Link from 'next/link'

export default function TopBar() {
	const { data: session } = useSession()

	const Content = session ? LoggedIn : LoggedOut

	return (
		<div className="w-full flex flex-col items-center space-y-2">
			<p className="text-2xl">Live Poll</p>
			<Content session={session} />
			<div className="flex flex-row">
				<Button asChild>
					<Link href="/">
						<HomeIcon />
					</Link>
				</Button>
				<Button asChild>
					<Link href="/settings">
						<SettingsIcon />
					</Link>
				</Button>
			</div>
		</div>
	)
}

function LoggedIn({ session }: { session: Session | null }) {
	if (!session) return null
	return (
		<>
			<p className="text-2xl">Logged in</p>
			<Image
				src={session.user?.image ?? ''}
				width={32}
				height={32}
				alt="twitch_avatar"
			/>
			<p>{session?.user?.name}</p>
			<Button onClick={() => signOut()}>Sign out</Button>
		</>
	)
}

function LoggedOut({ session }: { session: Session | null }) {
	return (
		<>
			<p className="text-2xl">Logged out</p>
			<Button onClick={() => signIn()}>Sign in</Button>
		</>
	)
}
