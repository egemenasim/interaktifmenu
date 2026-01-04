'use client'

import { useState } from 'react'
import Sidebar from '@/components/layout/sidebar'
import { Plan } from '@/lib/utils/tier-check'

interface DashboardShellProps {
    children: React.ReactNode
    userPlan: Plan
    restaurantName: string
}

export default function DashboardShell({ children, userPlan, restaurantName }: DashboardShellProps) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
            {/* Mobile Header */}
            <header className="md:hidden bg-white border-b border-gray-200 p-4 flex items-center justify-between sticky top-0 z-20">
                <div className="font-bold text-blue-600">InteraktifMenu</div>
                <button
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                    aria-label="Toggle Menu"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {isSidebarOpen ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        )}
                    </svg>
                </button>
            </header>

            {/* Sidebar Wrapper */}
            <div
                className={`
                    fixed inset-y-0 left-0 z-30 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0
                    ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                `}
            >
                <Sidebar
                    userPlan={userPlan}
                    restaurantName={restaurantName}
                    onClose={() => setIsSidebarOpen(false)}
                />
            </div>

            {/* Overlay for mobile */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-20 md:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Main Content */}
            <main className="flex-1 p-4 md:p-8 w-full">
                {children}
            </main>
        </div>
    )
}
