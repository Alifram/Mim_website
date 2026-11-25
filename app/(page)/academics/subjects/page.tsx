import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { connection } from 'next/server'

import SubjectManagement from '@/components/subjects/subject-management'
import { getCurrentProfile } from '@/lib/services/auth/auth-server-service'
import { getActiveSchoolSubjects } from '@/lib/services/subjects/subject-service'

export default function SubjectsPage() {
  return (
    <Suspense fallback={<SubjectsFallback />}>
      <SubjectsContent />
    </Suspense>
  )
}

async function SubjectsContent() {
  await connection()
  const profileResult = await getCurrentProfile()

  if (profileResult.status === 'unauthenticated') {
    redirect('/login')
  }
  if (profileResult.status !== 'authenticated') {
    return (
      <SubjectsMessage>
        Profil sekolah tidak dapat dimuat. Periksa koneksi dan kebijakan akses.
      </SubjectsMessage>
    )
  }
  if (profileResult.profile.role.trim().toLowerCase() !== 'admin') {
    return (
      <SubjectsMessage>
        Pengelolaan mata pelajaran hanya dapat diakses oleh administrator
        sekolah.
      </SubjectsMessage>
    )
  }

  const result = await getActiveSchoolSubjects()

  return (
    <SubjectManagement
      loadError={result.status === 'error' ? result.message : null}
      subjects={result.status === 'success' ? result.subjects : []}
    />
  )
}

function SubjectsMessage({ children }: { children: string }) {
  return (
    <p
      className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-6 text-amber-900 dark:border-[#795d23] dark:bg-[#3b3020] dark:text-[#ffe0a3]"
      role="alert"
    >
      {children}
    </p>
  )
}

function SubjectsFallback() {
  return (
    <div
      aria-busy="true"
      className="rounded-2xl border border-[#e5ebe7] bg-white p-6 text-sm text-[#65736a] dark:border-[#616161] dark:bg-[#1c2d35] dark:text-[#c5c2ba]"
      role="status"
    >
      Memuat mata pelajaran…
    </div>
  )
}
