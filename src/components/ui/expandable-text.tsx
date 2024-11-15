import { cn } from '@/lib/utils'
import React, { useEffect } from 'react'

const ExpandableText = ({
	children,
	open: openProp,
	minLines = 1,
}: {
	children: React.ReactNode
	open?: boolean
	minLines?: number
}) => {
	const [open, setOpen] = React.useState(openProp ?? false)
	const [textHeight, setTextHeight] = React.useState(0)
	const [showPreview, setShowPreview] = React.useState(openProp ?? false)

	const textRef = React.useRef<HTMLSpanElement>(null)

	useEffect(() => {
		if (textRef.current) {
			setTextHeight(textRef.current.getBoundingClientRect().height)
		}
	}, [])

	function toggleOpen() {
		setOpen(prev => {
			if (!prev)
				setTimeout(() => {
					setShowPreview(!prev)
				}, 150)
			else setShowPreview(!prev)
			return !prev
		})
	}

	const isOpen = open || openProp

	return (
		<div className="relative">
			<div
				className="absolute top-0 pointer-events-none z-0"
				style={{ opacity: showPreview ? '0' : '100%' }}
			>
				<span className="line-clamp-2" ref={textRef}>
					{children}
				</span>
			</div>
			<div
				className="relative top-0 grid transition-all duration-300 ease-in-out"
				style={{
					gridTemplateRows: isOpen ? '1fr' : '0fr',
					minHeight: textHeight ? `${textHeight}px` : 'auto',
				}}
				onClick={toggleOpen}
			>
				<div
					className={cn(
						'w-full overflow-hidden text-ellipsis cursor-pointer z-10',
						isOpen ? '' : 'whitespace-nowrap line-clamp-2'
					)}
				>
					<span>{children}</span>
				</div>
			</div>
		</div>
	)
}
ExpandableText.displayName = 'Expandable'

export default ExpandableText
