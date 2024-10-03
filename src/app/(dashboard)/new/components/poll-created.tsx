import { CircleCheckIcon } from 'lucide-react'
import Link from 'next/link'

export default function PollCreated() {
	return (
		<div className="w-full flex flex-col items-center space-y-2">
			<CircleCheckIcon size={64} />
			<p className="text-2xl">Poll created</p>

			<Link href="/">Back</Link>
		</div>
	)
}
