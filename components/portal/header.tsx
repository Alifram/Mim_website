'use client'

import { Menu } from 'lucide-react'
import { usePathname } from 'next/navigation'

import {
  getPortalPageTitle,
  getPortalRoleLabel,
} from '@/lib/portal/navigation'
import ThemeToggle from '@/components/theme/theme-toggle'

type PortalHeaderProps = {
  name: string
  role: string
  onMenuClick: () => void
}

export default function PortalHeader({
  name,
  role,
  onMenuClick,
}: PortalHeaderProps) {
  const pathname = usePathname()
  const initials = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()

  return (
    <header className="sticky top-0 z-20 border-b border-[#e7ece8] bg-white/95 backdrop-blur dark:border-[#424242] dark:bg-[#111b21]/95">
      <div className="flex min-h-[76px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <button
            aria-label="Buka menu navigasi"
            className="grid size-10 shrink-0 place-items-center rounded-xl border border-[#e1e9e3] text-[#456052] transition hover:bg-[#f3f7f4] dark:border-[#424242] dark:text-[#d8d5cd] dark:hover:bg-[#1c2d35] lg:hidden"
            onClick={onMenuClick}
            type="button"
          >
            <Menu aria-hidden="true" size={20} />
          </button>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#0f6a42] dark:text-[#ffd166]">
              Portal sekolah
            </p>
            <h1 className="mt-1 truncate text-base font-bold text-[#1d2b23] dark:text-[#e8e5de] sm:text-lg">
              {getPortalPageTitle(pathname)}
            </h1>
          </div>
        </div>

        <div className="flex min-w-0 items-center gap-3">
          <div className="hidden min-w-0 text-right sm:block">
            <p className="max-w-48 truncate text-[13px] font-semibold text-[#26382e] dark:text-[#e8e5de]">
              {name}
            </p>
            <p className="mt-0.5 text-[11px] text-[#718078] dark:text-[#c5c2ba]">
              {getPortalRoleLabel(role)}
            </p>
          </div>
          <ThemeToggle compact />
          <div
            aria-hidden="true"
            className="grid size-10 shrink-0 place-items-center rounded-full bg-[#e6f0e9] text-sm font-bold text-[#0f5132] dark:bg-[#1c2d35] dark:text-[#ffd166]"
          >
            {initials}
          </div>
        </div>
      </div>
    </header>
  )
}