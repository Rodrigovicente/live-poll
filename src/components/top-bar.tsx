'use client'
import { useSession, signIn, signOut } from 'next-auth/react'
import { Button } from './ui/button'
import { Session } from 'next-auth'
import Image from 'next/image'
import Link from 'next/link'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from './ui/dropdown-menu'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

export default function TopBar() {
	const { data: session } = useSession()

	const [isScrolled, setIsScrolled] = useState(false)

	useEffect(() => {
		window.addEventListener('scroll', handleScroll, { passive: true })

		return () => {
			window.removeEventListener('scroll', handleScroll)
		}
	}, [])

	function handleScroll(e: Event) {
		setIsScrolled(window.scrollY > 5)
	}
	console.log('::::', isScrolled)

	const LoggedContent = session ? LoggedIn : LoggedOut

	return (
		<div
			className={cn(
				'fixed top-0 z-50 w-full h-16 flex flex-col items-center justify-center backdrop-blur-lg border-b transition-colors duration-300',
				isScrolled ? 'border-purple-300/10' : 'border-purple-300/0'
			)}
		>
			<div className="w-full max-w-screen-xl px-5 flex justify-between items-center">
				<Logo />
				<Navigation />
				<LoggedContent session={session} />
			</div>
		</div>
	)
}

function Logo() {
	return (
		<Link href="/" className="basis-1/3 shrink-0 grow-0 text-2xl">
			Live<span className="font-bold">Poll</span>
		</Link>
	)
}

function Navigation() {
	return (
		<ul className="basis-1/3 shrink-0 grow-0 flex flex-row gap-2">
			<li>
				<Button variant="ghost" asChild>
					<Link href="/">Home</Link>
				</Button>
			</li>
			<li>
				<Button variant="ghost" asChild>
					<Link href="/about">About</Link>
				</Button>
			</li>
		</ul>
	)
}

function LoggedIn({ session }: { session: Session | null }) {
	if (!session || !session.user) return null
	return (
		<DropdownMenu>
			<DropdownMenuTrigger>
				<div className="basis-1/3 shrink-0 grow-0 px-3 py-2 flex flex-row items-center gap-3 rounded-lg hover:bg-purple-300/10">
					<div>{session.user.name}</div>
					<div className="w-fit h-fit min-w-8 min-h-8 rounded-full overflow-hidden">
						<Image
							src={session.user?.image ?? ''}
							width={32}
							height={32}
							alt="twitch_avatar"
						/>
					</div>
				</div>
			</DropdownMenuTrigger>
			<DropdownMenuContent>
				<Link href="/settings">
					<DropdownMenuItem className="cursor-pointer">
						My account
					</DropdownMenuItem>
				</Link>
				<DropdownMenuSeparator />
				<DropdownMenuItem className="cursor-pointer" onClick={() => signOut()}>
					Sign out
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	)
}

function LoggedOut({ session }: { session: Session | null }) {
	return (
		<div>
			<Button variant="glowy" onClick={() => signIn()}>
				Sign in
			</Button>
		</div>
	)
}
