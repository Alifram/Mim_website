import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { connection } from 'next/server'

import AssignmentManagement from '@/components/assignments/assignment-management'
import { getCurrentProfile } from '@/lib/services/auth/auth-server-service'
import { getAdminAssignmentData } from '@/lib/services/assignments/assignment-service'

export default function TeachingAssignmentsPage() {
  return (
    <Suspense fallback={<AssignmentsFallback />}>
      <TeachingAssignmentsContent />
    </Suspense>
  )
}

async function TeachingAssignmentsContent() {
  await connection()
  const profileResult = await getCurrentProfile()

  if (profileResult.status === 'unauthenticated') {
    redirect('/login')
  }
  if (profileResult.status !== 'authenticated') {
    return (
      <AssignmentsMessage>
        Profil sekolah tidak dapat dimuat. Periksa koneksi dan kebijakan akses.
      </AssignmentsMessage>
    )
  }
  if (profileResult.profile.role.trim().toLowerCase() !== 'admin') {
    return (
      <AssignmentsMessage>
        Pengelolaan penugasan hanya dapat dilakukan oleh administrator
        sekolah.
      </AssignmentsMessage>
    )
  }

  const result = await getAdminAssignmentData()
  const currentDate = new Date()
  const startYear =
    currentDate.getMonth() >= 6
      ? currentDate.getFullYear()
      : currentDate.getFullYear() - 1

  return (
    <AssignmentManagement
      data={
        result.status === 'success'
          ? result.data
          : { classes: [], subjects: [], teachers: [], assignments: [] }
      }
      initialSchoolYear={`${startYear}/${startYear + 1}`}
      loadError={result.status === 'error' ? result.message : null}
    />
  )
}

function AssignmentsMessage({ children }: { children: string }) {
  return (
    <p
      className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-6 text-amber-900 dark:border-[#795d23] dark:bg-[#3b3020] dark:text-[#ffe0a3]"
      role="alert"
    >
      {children}
    </p>
  )
}

function AssignmentsFallback() {
  return (
    <div
      aria-busy="true"
      className="rounded-2xl border border-[#e5ebe7] bg-white p-6 text-sm text-[#65736a] dark:border-[#616161] dark:bg-[#1c2d35] dark:text-[#c5c2ba]"
      role="status"
    >
      Memuat data penugasan…
    </div>
  )
}
