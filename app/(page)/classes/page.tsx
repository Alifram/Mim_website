import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { connection } from 'next/server'

import ClassRoster from '@/components/classes/class-roster'
import { getCurrentProfile } from '@/lib/services/auth/auth-server-service'
import { getAdminStudentRoster } from '@/lib/services/classes/class-service'

export default function ClassesPage() {
  return (
    <Suspense fallback={<ClassesFallback />}>
      <ClassesContent />
    </Suspense>
  )
}

async function ClassesContent() {
  await connection()
  const profileResult = await getCurrentProfile()

  if (profileResult.status === 'unauthenticated') {
    redirect('/login')
  }
  if (profileResult.status !== 'authenticated') {
    return (
      <ClassesMessage>
        Profil sekolah tidak dapat dimuat. Periksa koneksi dan kebijakan akses.
      </ClassesMessage>
    )
  }
  if (profileResult.profile.role.trim().toLowerCase() !== 'admin') {
    return (
      <ClassesMessage>
        Halaman Data Kelas hanya dapat diakses oleh administrator sekolah.
      </ClassesMessage>
    )
  }

  const result = await getAdminStudentRoster()

  if (result.status === 'error') {
    return <ClassesMessage>{result.message}</ClassesMessage>
  }

  return <ClassRoster students={result.students} />
}

function ClassesMessage({ children }: { children: string }) {
  return (
    <p
      className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-6 text-amber-900 dark:border-[#795d23] dark:bg-[#3b3020] dark:text-[#ffe0a3]"
      role="alert"
    >
      {children}
    </p>
  )
}

function ClassesFallback() {
  return (
    <div
      aria-busy="true"
      className="rounded-2xl border border-[#e5ebe7] bg-white p-6 text-sm text-[#65736a] dark:border-[#616161] dark:bg-[#1c2d35] dark:text-[#c5c2ba]"
      role="status"
    >
      Memuat data siswa…
    </div>
  )
}
