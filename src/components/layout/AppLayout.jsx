import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Sidebar from './Sidebar'
import { useState } from 'react'

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div
      className="flex min-h-screen overflow-hidden text-white font-['Inter',_sans-serif]"
      style={{ background: '#0d0d14' }}
    >
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex flex-1 flex-col h-screen overflow-y-auto overflow-x-hidden">
        <Navbar onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />

        <main className="flex-1 w-full max-w-[1400px] mx-auto px-4 py-5 md:px-6 md:py-6 animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
