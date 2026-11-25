import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { connection } from 'next/server'

import AcademicStatistics from '@/components/academics/academic-statistics'
import { getCurrentProfile } from '@/lib/services/auth/auth-server-service'
import { getAdminMonitoringUsers } from '@/lib/services/classes/class-service'
import { getAcademicStatistics } from '@/lib/services/academics/academic-statistics-service'

export default function AcademicStatisticsPage() {
  return (
    <Suspense fallback={<StatisticsFallback />}>
      <StatisticsContent />
    </Suspense>
  )
}

async function StatisticsContent() {
  await connection()
  const profileResult = await getCurrentProfile()

  if (profileResult.status === 'unauthenticated') {
    redirect('/login')
  }
  if (profileResult.status !== 'authenticated') {
    return (
      <StatisticsMessage>
        Profil sekolah tidak dapat dimuat. Periksa koneksi dan kebijakan akses.
      </StatisticsMessage>
    )
  }

  const role = profileResult.profile.role.trim().toLowerCase()
  if (role !== 'admin' && role !== 'guru') {
    return (
      <StatisticsMessage>
        Statistik akademik hanya tersedia untuk admin dan guru.
      </StatisticsMessage>
    )
  }

  const initialYear = getCurrentYearInJakarta()
  const [statisticsResult, rosterResult] = await Promise.all([
    getAcademicStatistics(initialYear),
    role === 'admin'
      ? getAdminMonitoringUsers()
      : Promise.resolve({ status: 'success' as const, users: [] }),
  ])

  return (
    <AcademicStatistics
      initialError={
        statisticsResult.status === 'error' ? statisticsResult.message : null
      }
      initialRosterError={
        rosterResult.status === 'error' ? rosterResult.message : null
      }
      initialStatistics={
        statisticsResult.status === 'success'
          ? statisticsResult.statistics
          : []
      }
      initialYear={initialYear}
      role={role}
      users={rosterResult.status === 'success' ? rosterResult.users : []}
    />
  )
}

function getCurrentYearInJakarta() {
  const year = new Intl.DateTimeFormat('en', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
  }).format(new Date())

  return Number(year)
}

function StatisticsMessage({ children }: { children: string }) {
  return (
    <p
      className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-6 text-amber-900 dark:border-[#795d23] dark:bg-[#3b3020] dark:text-[#ffe0a3]"
      role="alert"
    >
      {children}
    </p>
  )
}

function StatisticsFallback() {
  return (
    <div
      aria-busy="true"
      className="rounded-2xl border border-[#e5ebe7] bg-white p-6 text-sm text-[#65736a] dark:border-[#616161] dark:bg-[#1c2d35] dark:text-[#c5c2ba]"
      role="status"
    >
      Memuat statistik akademik…
    </div>
  )
}