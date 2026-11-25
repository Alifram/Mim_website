import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { connection } from 'next/server'

import StudentReportCardView from '@/components/grades/student-report-card-view'
import { getCurrentProfile } from '@/lib/services/auth/auth-server-service'
import { getStudentReport } from '@/lib/services/grades/student-report-service'

export default function ReportCardsPage() {
  return (
    <Suspense fallback={<ReportCardsFallback />}>
      <ReportCardsContent />
    </Suspense>
  )
}

async function ReportCardsContent() {
  await connection()
  const profileResult = await getCurrentProfile()

  if (profileResult.status === 'unauthenticated') {
    redirect('/login')
  }
  if (profileResult.status !== 'authenticated') {
    return (
      <ReportCardsMessage>
        Profil sekolah tidak dapat dimuat. Periksa koneksi dan kebijakan akses.
      </ReportCardsMessage>
    )
  }
  if (profileResult.profile.role.trim().toLowerCase() !== 'siswa') {
    return (
      <ReportCardsMessage>
        Rapor digital hanya dapat dibuka oleh akun siswa. Akses orang tua perlu
        ditautkan ke akun anak terlebih dahulu.
      </ReportCardsMessage>
    )
  }

  const result = await getStudentReport()
  if (result.status === 'error') {
    return <ReportCardsMessage>{result.message}</ReportCardsMessage>
  }

  return (
    <StudentReportCardView
      report={result.report}
      studentName={profileResult.profile.nama_lengkap}
      studentNumber={profileResult.profile.nomor_induk}
    />
  )
}

function ReportCardsMessage({ children }: { children: string }) {
  return (
    <section className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 dark:border-[#795d23] dark:bg-[#3b3020]">
      <p
        className="text-sm leading-6 text-amber-900 dark:text-[#ffe0a3]"
        role="alert"
      >
        {children}
      </p>
    </section>
  )
}

function ReportCardsFallback() {
  return (
    <div
      aria-busy="true"
      className="rounded-2xl border border-[#e5ebe7] bg-white p-6 text-sm text-[#65736a] dark:border-[#616161] dark:bg-[#1c2d35] dark:text-[#c5c2ba]"
      role="status"
    >
      Memuat rapor siswa…
    </div>
  )
}
