import { Suspense, type ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { connection } from 'next/server'

import PortalShell from '@/components/portal/portal-shell'
import { logout } from '@/lib/services/auth/auth-actions'
import { getCurrentProfile } from '@/lib/services/auth/auth-server-service'

export default function PageLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <Suspense fallback={<PortalFallback />}>
      <AuthenticatedPortal>{children}</AuthenticatedPortal>
    </Suspense>
  )
}

async function AuthenticatedPortal({ children }: { children: ReactNode }) {
  await connection()
  const result = await getCurrentProfile()

  if (result.status === 'unauthenticated') {
    redirect('/login')
  }
  if (result.status === 'error') {
    return (
      <PortalProfileError message="Sesi atau profil sekolah tidak dapat dimuat. Periksa koneksi dan kebijakan akses, lalu coba lagi." />
    )
  }
  if (result.status === 'missing-profile') {
    return (
      <PortalProfileError message="Akun ini belum memiliki profil sekolah aktif. Silakan hubungi administrator sekolah." />
    )
  }

  return (
    <PortalShell name={result.profile.nama_lengkap} role={result.profile.role}>
      {children}
    </PortalShell>
  )
}

function PortalFallback() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#f3f6f4] p-6 dark:bg-[#0b141a]">
      <p className="rounded-2xl border border-[#e3eae5] bg-white px-6 py-4 text-sm text-[#65736a] shadow-sm dark:border-[#616161] dark:bg-[#1c2d35] dark:text-[#c5c2ba]" role="status">
        Memuat portal sekolah…
      </p>
    </main>
  )
}

function PortalProfileError({ message }: { message: string }) {
  return (
    <main className="grid min-h-screen place-items-center bg-[#f3f6f4] p-6 dark:bg-[#0b141a]">
      <section
        aria-labelledby="profile-error-title"
        className="w-full max-w-lg rounded-2xl border border-[#e3eae5] bg-white p-7 shadow-sm dark:border-[#616161] dark:bg-[#1c2d35]"
      >
        <h1
          className="text-xl font-bold text-[#1d2b23] dark:text-[#e8e5de]"
          id="profile-error-title"
        >
          Portal belum dapat dibuka
        </h1>
        <p className="mt-3 text-sm leading-6 text-[#65736a] dark:text-[#c5c2ba]" role="alert">
          {message}
        </p>
        <form action={logout}>
          <button
            className="mt-6 min-h-11 rounded-xl bg-[#0f5132] px-4 text-sm font-semibold text-white transition hover:bg-[#0b4229] dark:bg-[#ffd166] dark:text-[#172027] dark:hover:bg-[#ffdc85]"
            type="submit"
          >
            Keluar
          </button>
        </form>
      </section>
    </main>
  )
}