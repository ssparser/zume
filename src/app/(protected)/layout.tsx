import { AppSidebar } from '@/components/appsidebar'
import { ThemeToggle } from '@/components/theme-toggle'
import { SidebarProvider } from '@/components/ui/sidebar'
import { UserButton } from '@clerk/nextjs'
import React from 'react'

type Props = {
    children: React.ReactNode
}

const layout = ({children}: Props) => {
  return (
    <SidebarProvider>
      <AppSidebar/>
      <main className='w-full m-2'>
        <div className='flex items-center justify-between gap-2 border-siderbar-border bg-sidebar border shadow rounded-md p-2 px-4'>
            {/* <SearchBar/> */}
            <UserButton/>
            <div className='flex flex-row gap-2'>
            <ThemeToggle/>
            <UserButton/>
            </div>
        </div>
        <div className='h-4'/>
        <div className='border-sidebar-border bg-sidebar border shadow rounded-md overflow-y-scroll h-[calc(100dvh-85px)] p-4'>
          {children}
        </div>
      </main>
    </SidebarProvider>
  )
}

export default layout
