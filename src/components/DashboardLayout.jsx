import { Outlet } from 'react-router-dom'
import { useState } from 'react'
import Navbar from './Navbar'
import Sidebar from './Sidebar'

export default function DashboardLayout() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggle={() => setIsSidebarCollapsed((prev) => !prev)}
      />
      <main className={`min-w-0 transition-[margin-left] duration-300 ${isSidebarCollapsed ? 'ml-20' : 'ml-64'} px-8 py-10`}>
        <Outlet />
      </main>
    </div>
  )
}
