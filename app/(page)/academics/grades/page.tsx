import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { connection } from 'next/server'

import TeacherGradeEntry from '@/components/grades/teacher-grade-entry'
import { getCurrentProfile } from '@/lib/services/auth/auth-server-service'
import {
  getTeacherGradeAssignments,
  getTeacherGradeStudents,
} from '@/lib/services/grades/teacher-grade-service'

export default function GradesPage() {
  return (
    <Suspense fallback={<GradesFallback />}>
      <GradesContent />
    </Suspense>
  )
}

async function GradesContent() {
  await connection()
  const profileResult = await getCurrentProfile()

  if (profileResult.status === 'unauthenticated') {
    redirect('/login')
  }
  if (profileResult.status !== 'authenticated') {
    return (
      <GradesMessage>
        Profil sekolah tidak dapat dimuat. Periksa koneksi dan kebijakan akses.
      </GradesMessage>
    )
  }

  if (profileResult.profile.role.trim().toLowerCase() !== 'guru') {
    return (
      <GradesMessage>
        Input nilai rapor hanya dapat dilakukan oleh guru.
      </GradesMessage>
    )
  }

  const assignmentResult = await getTeacherGradeAssignments()
  const defaultClassId = profileResult.profile.kelas_id
  const initialClass =
    assignmentResult.status === 'success'
      ? assignmentResult.assignments.find(
          (assignment) => assignment.kelas_id === defaultClassId,
        ) ?? assignmentResult.assignments[0]
      : undefined
  const studentsResult =
    initialClass === undefined
      ? null
      : await getTeacherGradeStudents(initialClass.kelas_id)
  const initialDate = getTodayInJakarta()

  return (
    <TeacherGradeEntry
      assignments={
        assignmentResult.status === 'success'
          ? assignmentResult.assignments
          : []
      }
      defaultClassId={defaultClassId}
      initialAssignmentError={
        assignmentResult.status === 'error'
          ? assignmentResult.message
          : null
      }
      initialDate={initialDate}
      initialStudents={
        studentsResult?.status === 'success' ? studentsResult.students : []
      }
      initialStudentsError={
        studentsResult?.status === 'error'
          ? studentsResult.message
          : studentsResult?.status === 'success' &&
              studentsResult.students.length === 0
            ? `Belum ada siswa aktif di ${initialClass?.kelas ?? 'kelas ini'}.`
            : null
      }
      teacherName={profileResult.profile.nama_lengkap}
    />
  )
}

function getTodayInJakarta() {
  const dateParts = Object.fromEntries(
    new Intl.DateTimeFormat('en', {
      timeZone: 'Asia/Jakarta',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
      .formatToParts(new Date())
      .map(({ type, value }) => [type, value]),
  )

  return `${dateParts.year}-${dateParts.month}-${dateParts.day}`
}

function GradesMessage({ children }: { children: string }) {
  return (
    <p
      className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-6 text-amber-900 dark:border-[#795d23] dark:bg-[#3b3020] dark:text-[#ffe0a3]"
      role="alert"
    >
      {children}
    </p>
  )
}

function GradesFallback() {
  return (
    <div
      aria-busy="true"
      className="rounded-2xl border border-[#e5ebe7] bg-white p-6 text-sm text-[#65736a] dark:border-[#616161] dark:bg-[#1c2d35] dark:text-[#c5c2ba]"
      role="status"
    >
      Memuat penugasan guru…
    </div>
  )
}