import React from 'react'

const PollMultipleIcon = ({
	size = 32,
	className,
}: {
	size?: number
	className?: string
}) => {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 92.7 92.7"
			width={size}
			height={size}
			className={className}
		>
			<g>
				<g fill="currentColor">
					<path d="M32.85,0H9.4A9.4,9.4,0,0,0,0,9.4V32.85a9.4,9.4,0,0,0,9.4,9.41H32.85a9.41,9.41,0,0,0,9.41-9.41V9.4A9.4,9.4,0,0,0,32.85,0Zm0,37H9.4a4.16,4.16,0,0,1-4.15-4.16V9.4A4.15,4.15,0,0,1,9.4,5.25H32.85a4.13,4.13,0,0,1,3.6,2.12L20.23,23.6,14,17.33l-5,5L20.23,33.49,37,16.71V32.85A4.17,4.17,0,0,1,32.85,37Z" />
					<path d="M83.3,5.25A4.15,4.15,0,0,1,87.45,9.4V32.85A4.16,4.16,0,0,1,83.3,37H59.85a4.17,4.17,0,0,1-4.16-4.16V9.4a4.16,4.16,0,0,1,4.16-4.15H83.3M83.3,0H59.85a9.4,9.4,0,0,0-9.41,9.4V32.85a9.41,9.41,0,0,0,9.41,9.41H83.3a9.4,9.4,0,0,0,9.4-9.41V9.4A9.4,9.4,0,0,0,83.3,0Z" />
					<path d="M32.85,55.69A4.17,4.17,0,0,1,37,59.85V83.3a4.16,4.16,0,0,1-4.16,4.15H9.4A4.15,4.15,0,0,1,5.25,83.3V59.85A4.16,4.16,0,0,1,9.4,55.69H32.85m0-5.25H9.4A9.4,9.4,0,0,0,0,59.85V83.3a9.4,9.4,0,0,0,9.4,9.4H32.85a9.4,9.4,0,0,0,9.41-9.4V59.85a9.41,9.41,0,0,0-9.41-9.41Z" />
					<path d="M83.3,50.44H59.85a9.41,9.41,0,0,0-9.41,9.41V83.3a9.4,9.4,0,0,0,9.41,9.4H83.3a9.4,9.4,0,0,0,9.4-9.4V59.85A9.4,9.4,0,0,0,83.3,50.44Zm0,37H59.85a4.16,4.16,0,0,1-4.16-4.15V59.85a4.17,4.17,0,0,1,4.16-4.16H83.3a4.14,4.14,0,0,1,3.6,2.12L70.67,74,64.4,67.78l-4.94,4.94L70.67,83.94,87.45,67.16V83.3A4.15,4.15,0,0,1,83.3,87.45Z" />
				</g>
			</g>
		</svg>
	)
}

export default PollMultipleIcon
