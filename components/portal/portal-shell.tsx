'use client'

import { useState, type ReactNode } from 'react'

import PortalHeader from '@/components/portal/header'
import PortalSidebar from '@/components/portal/sidebar'

type PortalShellProps = {
  children: ReactNode
  name: string
  role: string
}

export default function PortalShell({
  children,
  name,
  role,
}: PortalShellProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[#f3f6f4] dark:bg-[#0b141a]">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 lg:block">
        <PortalSidebar role={role} />
      </aside>

      <div
        aria-hidden={!isMobileMenuOpen}
        className={`fixed inset-0 z-50 flex transition-opacity duration-300 ease-out motion-reduce:transition-none lg:hidden ${
          isMobileMenuOpen
            ? 'pointer-events-auto opacity-100'
            : 'pointer-events-none opacity-0'
        }`}
        inert={!isMobileMenuOpen}
        role="dialog"
        aria-modal={isMobileMenuOpen}
      >
        <button
          aria-label="Tutup menu navigasi"
          className={`absolute inset-0 bg-[#10251a]/55 transition-opacity duration-300 ease-out motion-reduce:transition-none ${
            isMobileMenuOpen ? 'opacity-100' : 'opacity-0'
          }`}
          disabled={!isMobileMenuOpen}
          onClick={() => setIsMobileMenuOpen(false)}
          tabIndex={isMobileMenuOpen ? 0 : -1}
          type="button"
        />
        <div
          className={`relative h-full w-72 max-w-[88vw] shadow-2xl transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
            isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <PortalSidebar
            onClose={() => setIsMobileMenuOpen(false)}
            role={role}
          />
        </div>
      </div>

      <div className="min-h-screen lg:pl-64">
        <PortalHeader
          name={name}
          onMenuClick={() => setIsMobileMenuOpen(true)}
          role={role}
        />
        <main className="mx-auto min-h-[calc(100vh-124px)] w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </main>
        <footer className="border-t border-[#e7ece8] px-4 py-4 text-center text-[11px] text-[#7b8981] dark:border-[#424242] dark:text-[#c5c2ba] sm:px-6 lg:px-8">
          © MIM Pasir Lor · Portal Sekolah
        </footer>
      </div>
    </div>
  )
}
