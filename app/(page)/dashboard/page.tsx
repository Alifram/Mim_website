import { Suspense } from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { connection } from 'next/server'
import {
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  ChartNoAxesCombined,
  Megaphone,
  School,
  UsersRound,
} from 'lucide-react'

import { getPortalNavigation } from '@/lib/portal/navigation'
import { getCurrentProfile } from '@/lib/services/auth/auth-server-service'
import { getAdminDashboardSummary } from '@/lib/services/dashboard/dashboard-service'

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardFallback />}>
      <DashboardContent />
    </Suspense>
  )
}

async function DashboardContent() {
  await connection()
  const profileResult = await getCurrentProfile()

  if (profileResult.status === 'unauthenticated') {
    redirect('/login')
  }
  if (profileResult.status === 'error') {
    return (
      <DashboardMessage>
        Profil sekolah tidak dapat dimuat. Periksa koneksi dan kebijakan akses.
      </DashboardMessage>
    )
  }
  if (profileResult.status === 'missing-profile') {
    return (
      <DashboardMessage>
        Akun ini belum memiliki profil sekolah aktif. Silakan hubungi
        administrator sekolah.
      </DashboardMessage>
    )
  }

  const { nama_lengkap: name, role } = profileResult.profile
  const isAdmin = role.trim().toLowerCase() === 'admin'
  const summaryResult = isAdmin ? await getAdminDashboardSummary() : null
  const navigation = getPortalNavigation(role)
  const availableQuickLinks =
    navigation?.filter(
      (item) => item.href !== '/dashboard' && item.href !== '/profile',
    ) ?? []
  const quickLinks = isAdmin
    ? availableQuickLinks
    : availableQuickLinks.slice(0, 4)

  const statistics =
    summaryResult?.status === 'success'
      ? [
          {
            title: 'Total siswa',
            value: summaryResult.data.total_siswa,
            icon: UsersRound,
            color: 'bg-blue-50 text-blue-700',
          },
          {
            title: 'Total guru',
            value: summaryResult.data.total_guru,
            icon: BookOpen,
            color: 'bg-violet-50 text-violet-700',
          },
          {
            title: 'Total kelas',
            value: summaryResult.data.total_kelas,
            icon: School,
            color: 'bg-amber-50 text-amber-700',
          },
          {
            title: 'Pengumuman',
            value: summaryResult.data.total_pengumuman,
            icon: Megaphone,
            color: 'bg-emerald-50 text-emerald-700',
          },
        ]
      : []

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-3xl bg-[linear-gradient(120deg,#0f5132_0%,#176a45_100%)] px-6 py-7 text-white shadow-[0_16px_40px_rgba(15,81,50,0.14)] dark:bg-[linear-gradient(120deg,#128c7e_0%,#075e54_100%)] dark:shadow-none sm:px-8 sm:py-9">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/70">
          Portal akademik MIM Pasir Lor
        </p>
        <h2 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
          Selamat datang, {name}
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-white/75">
          Gunakan portal ini untuk mengakses informasi dan layanan sekolah
          sesuai dengan akun Anda.
        </p>
      </section>

      {isAdmin ? (
        <section aria-labelledby="statistics-title">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#0f6a42] dark:text-[#ffd166]">
                Data sekolah
              </p>
              <h2
                className="mt-1 text-lg font-bold text-[#1d2b23] dark:text-[#e8e5de]"
                id="statistics-title"
              >
                Ringkasan
              </h2>
            </div>
            <ChartNoAxesCombined
              aria-hidden="true"
              className="mb-1 text-[#0f5132] dark:text-[#ffd166]"
              size={20}
            />
          </div>

          {summaryResult?.status === 'error' ? (
            <p
              className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900"
              role="alert"
            >
              {summaryResult.message}
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {statistics.map(({ title, value, icon: Icon, color }) => (
                <article
                  className="rounded-2xl border border-[#e5ebe7] bg-white p-5 shadow-sm dark:border-[#616161] dark:bg-[#1c2d35]"
                  key={title}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[13px] font-medium text-[#718078] dark:text-[#c5c2ba]">
                        {title}
                      </p>
                      <p className="mt-3 text-3xl font-bold tracking-tight text-[#1d2b23] dark:text-[#e8e5de]">
                        {new Intl.NumberFormat('id-ID').format(value)}
                      </p>
                    </div>
                    <span
                      className={`grid size-10 place-items-center rounded-xl ${color}`}
                    >
                      <Icon aria-hidden="true" size={19} />
                    </span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      ) : null}

      <section aria-labelledby="quick-links-title">
        <div className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#0f6a42] dark:text-[#ffd166]">
            {isAdmin ? 'Menu admin' : 'Pintasan'}
          </p>
          <h2
            className="mt-1 text-lg font-bold text-[#1d2b23] dark:text-[#e8e5de]"
            id="quick-links-title"
          >
            {isAdmin ? 'Menu utama' : 'Akses cepat'}
          </h2>
        </div>
        {quickLinks.length ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {quickLinks.map(({ title, description, href, icon: Icon }) => (
              <Link
                className="group rounded-2xl border border-[#e5ebe7] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[#b8d2c1] hover:shadow-md dark:border-[#616161] dark:bg-[#1c2d35] dark:hover:border-[#757575]"
                href={href}
                key={href}
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="grid size-10 place-items-center rounded-xl bg-[#eaf3ed] text-[#0f5132] dark:bg-[#34434b] dark:text-[#ffd166]">
                    <Icon aria-hidden="true" size={19} />
                  </span>
                  <ArrowUpRight
                    aria-hidden="true"
                    className="text-[#9aa8a0] transition group-hover:text-[#0f5132] dark:text-[#c5c2ba] dark:group-hover:text-[#ffd166]"
                    size={18}
                  />
                </div>
                <h3 className="mt-5 text-sm font-bold text-[#26382e] dark:text-[#e8e5de]">
                  {title}
                </h3>
                <p className="mt-1.5 text-xs leading-5 text-[#718078] dark:text-[#c5c2ba]">
                  {description}
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <p
            className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
            role="alert"
          >
            Menu untuk role akun ini belum dikonfigurasi.
          </p>
        )}
      </section>

      {isAdmin ? (
        <section className="flex items-start gap-3 rounded-2xl border border-[#e5ebe7] bg-white p-5 dark:border-[#616161] dark:bg-[#1c2d35]">
          <CalendarDays
            aria-hidden="true"
            className="mt-0.5 shrink-0 text-[#0f5132] dark:text-[#ffd166]"
            size={19}
          />
          <div>
            <h2 className="text-sm font-bold text-[#26382e] dark:text-[#e8e5de]">
              Informasi sekolah
            </h2>
            <p className="mt-1 text-xs leading-5 text-[#718078] dark:text-[#c5c2ba]">
              Kelola pengumuman dan kegiatan melalui menu Informasi & kegiatan.
            </p>
          </div>
        </section>
      ) : null}
    </div>
  )
}

function DashboardMessage({ children }: { children: string }) {
  return (
    <p
      className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-6 text-amber-900"
      role="alert"
    >
      {children}
    </p>
  )
}

function DashboardFallback() {
  return (
    <div
      aria-busy="true"
      className="rounded-2xl border border-[#e5ebe7] bg-white p-6 text-sm text-[#65736a] dark:border-[#616161] dark:bg-[#1c2d35] dark:text-[#c5c2ba]"
      role="status"
    >
      Memuat ringkasan dashboard…
    </div>
  )
}