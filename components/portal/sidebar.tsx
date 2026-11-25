'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LogOut, X } from 'lucide-react'

import { logout } from '@/lib/services/auth/auth-actions'
import {
  getPortalNavigation,
  getPortalRoleLabel,
} from '@/lib/portal/navigation'

type PortalSidebarProps = {
  role: string
  onClose?: () => void
}

export default function PortalSidebar({
  role,
  onClose,
}: PortalSidebarProps) {
  const pathname = usePathname()
  const navigation = getPortalNavigation(role)
  const activeHref = navigation
    ?.filter(
      ({ href }) => pathname === href || pathname.startsWith(`${href}/`),
    )
    .sort((left, right) => right.href.length - left.href.length)[0]?.href

  return (
    <aside className="flex h-full flex-col bg-[#0c422b] px-4 py-5 text-white dark:bg-[#111b21]">
      <div className="flex items-center gap-3 px-2">
        <div className="grid md:size-18 sm:size-8 shrink-0 place-items-center rounded-xl border border-transparent  p-1.5">
          <div className="grid size-full place-items-center rounded-lg p-1">
            <Image
              src="/images/logo_mim.png"
              alt="Logo MIM Pasir Lor"
              width={36}
              height={36}
              className="size-full object-contain"
            />
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-extrabold tracking-wide dark:text-[#ffd166]">
            MIM PASIR LOR
          </p>
          <p className="mt-1 text-[10px] font-semibold tracking-[0.16em] text-white/60 dark:text-[#c5c2ba]">
            PORTAL SEKOLAH
          </p>
        </div>
        {onClose ? (
          <button
            aria-label="Tutup menu"
            className="grid size-9 place-items-center rounded-lg text-white/75 hover:bg-white/10 hover:text-white dark:text-[#d8d5cd] dark:hover:bg-[#1c2d35] lg:hidden"
            onClick={onClose}
            type="button"
          >
            <X aria-hidden="true" size={19} />
          </button>
        ) : null}
      </div>

      <div className="mx-2 mt-8 rounded-xl border border-white/10 bg-white/5 px-3 py-3 dark:border-[#424242] dark:bg-[#1c2d35]">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/55 dark:text-[#c5c2ba]">
          Masuk sebagai
        </p>
        <p className="mt-1.5 text-sm font-semibold dark:text-[#e8e5de]">
          {getPortalRoleLabel(role)}
        </p>
      </div>

      <nav aria-label="Navigasi utama" className="mt-8 flex-1">
        <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-white/45 dark:text-[#c5c2ba]">
          Menu utama
        </p>
        {navigation ? (
          <ul className="space-y-1">
            {navigation.map(({ title, href, icon: Icon }) => {
              const isActive = activeHref === href

              return (
                <li key={href}>
                  <Link
                    aria-current={isActive ? 'page' : undefined}
                    className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-[13px] font-medium transition ${
                      isActive
                        ? 'bg-white text-[#0f5132] shadow-sm dark:bg-[#ffd166] dark:text-[#172027]'
                        : 'text-white/75 hover:bg-white/10 hover:text-white dark:text-[#c5c2ba]'
                    }`}
                    href={href}
                    onClick={onClose}
                  >
                    <Icon aria-hidden="true" size={18} />
                    <span>{title}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        ) : (
          <p
            className="mx-2 rounded-xl border border-amber-200/20 bg-amber-200/10 px-3 py-3 text-xs leading-5 text-amber-100"
            role="alert"
          >
            Menu untuk role “{role}” belum dikonfigurasi.
          </p>
        )}
      </nav>

      <div className="mt-6 border-t border-white/10 pt-4 dark:border-[#424242]">
        <p className="px-2 pb-4 text-[11px] leading-5 text-white/55 dark:text-[#c5c2ba]">
          Membangun generasi Islami dan unggul.
        </p>
        <form action={logout}>
          <button
            className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-[13px] font-semibold text-white/75 transition hover:bg-white/10 hover:text-white dark:text-[#c5c2ba] dark:hover:bg-[#1c2d35] dark:hover:text-[#e8e5de]"
            type="submit"
          >
            <LogOut aria-hidden="true" size={18} />
            Keluar
          </button>
        </form>
      </div>
    </aside>
  )
}