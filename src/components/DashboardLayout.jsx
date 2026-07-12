import { Outlet } from 'react-router-dom'
import { useState } from 'react'
import Navbar from './Navbar'
import Sidebar from './Sidebar'

export default function DashboardLayout() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <Navbar variant="app" />
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggle={() => setIsSidebarCollapsed((prev) => !prev)}
      />
      <main className={`min-w-0 overflow-x-hidden transition-[margin-left] duration-300 ${isSidebarCollapsed ? 'lg:ml-20' : 'lg:ml-72'} px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10 xl:px-12`}>
        <Outlet />
      </main>
    </div>
  )
}
