'use client'

import { NextPage } from 'next'
import { Session } from 'next-auth'
import { SessionProvider } from 'next-auth/react'
import React from 'react'

const AppSessionProvider: NextPage<{
	children: React.ReactNode
	session: Session | null
}> = ({ children, session }) => {
	console.log('>>>>>>>>>>>>>>>>>>>>>>>>', session)
	return <SessionProvider session={session}>{children}</SessionProvider>
}

export default AppSessionProvider
