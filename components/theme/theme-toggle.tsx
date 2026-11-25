'use client'

import { useSyncExternalStore } from 'react'
import { Monitor, Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'

type ThemeToggleProps = {
  compact?: boolean
}

const subscribe = () => () => {}
const getMountedSnapshot = () => true
const getServerSnapshot = () => false

export default function ThemeToggle({ compact = false }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme()
  const mounted = useSyncExternalStore(
    subscribe,
    getMountedSnapshot,
    getServerSnapshot,
  )

  if (!mounted) {
    return (
      <button
        aria-label="Memuat preferensi tema"
        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-[#dce5df] bg-white px-3 text-xs font-semibold text-[#456052] dark:border-[#424242] dark:bg-[#1c2d35] dark:text-[#e8e5de]"
        disabled
        type="button"
      >
        <Monitor aria-hidden="true" size={17} />
        {!compact ? <span>Tema perangkat</span> : null}
      </button>
    )
  }

  const currentTheme = theme ?? 'system'
  const nextTheme =
    currentTheme === 'system'
      ? 'light'
      : currentTheme === 'light'
        ? 'dark'
        : 'system'
  const currentLabel =
    currentTheme === 'system'
      ? 'Tema perangkat'
      : currentTheme === 'dark'
        ? 'Mode gelap'
        : 'Mode terang'
  const nextAction =
    nextTheme === 'system'
      ? 'Ikuti tema perangkat'
      : nextTheme === 'dark'
        ? 'Aktifkan mode gelap'
        : 'Aktifkan mode terang'

  return (
    <button
      aria-label={nextAction}
      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-[#dce5df] bg-white px-3 text-xs font-semibold text-[#456052] transition hover:bg-[#f3f7f4] dark:border-[#424242] dark:bg-[#1c2d35] dark:text-[#e8e5de] dark:hover:bg-[#1c2d35]"
      onClick={() => setTheme(nextTheme)}
      title={`${currentLabel}. ${nextAction}.`}
      type="button"
    >
      {currentTheme === 'system' ? (
        <Monitor aria-hidden="true" size={17} />
      ) : currentTheme === 'dark' ? (
        <Moon aria-hidden="true" size={17} />
      ) : (
        <Sun aria-hidden="true" size={17} />
      )}
      {!compact ? <span>{currentLabel}</span> : null}
    </button>
  )
}
