import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { connection } from 'next/server'

import AdminAttendanceHistory from '@/components/attendance/admin-attendance-history'
import StudentAttendanceView from '@/components/attendance/student-attendance-view'
import TeacherAttendanceEntry from '@/components/attendance/teacher-attendance-entry'
import { getCurrentProfile } from '@/lib/services/auth/auth-server-service'
import {
  getAdminAttendancePageData,
  getStudentAttendancePageData,
  getTeacherAttendancePageData,
} from '@/lib/services/attendance/attendance-service'

export default function AttendancePage() {
  return (
    <Suspense fallback={<AttendanceFallback />}>
      <AttendanceContent />
    </Suspense>
  )
}

async function AttendanceContent() {
  await connection()
  const profileResult = await getCurrentProfile()

  if (profileResult.status === 'unauthenticated') {
    redirect('/login')
  }
  if (profileResult.status !== 'authenticated') {
    return (
      <AttendanceMessage>
        Profil sekolah tidak dapat dimuat. Periksa koneksi dan kebijakan akses.
      </AttendanceMessage>
    )
  }

  const role = profileResult.profile.role.trim().toLowerCase()
  const today = getTodayInJakarta()
  if (role === 'siswa') {
    const result = await getStudentAttendancePageData()
    if (result.status === 'error') {
      return <AttendanceMessage>{result.message}</AttendanceMessage>
    }

    return (
      <StudentAttendanceView
        history={result.history}
        initialMonth={today.slice(0, 7)}
        studentName={profileResult.profile.nama_lengkap}
        studentNumber={profileResult.profile.nomor_induk}
      />
    )
  }
  if (role === 'guru') {
    const classId = profileResult.profile.kelas_id
    if (!classId) {
      return (
        <AttendanceMessage>
          Akun guru belum terhubung ke kelas. Hubungi admin untuk memeriksa profil.
        </AttendanceMessage>
      )
    }

    const result = await getTeacherAttendancePageData(classId, today)
    if (result.status === 'error') {
      return <AttendanceMessage>{result.message}</AttendanceMessage>
    }

    return (
      <TeacherAttendanceEntry
        classId={classId}
        className={result.data.className}
        date={today}
        initialHistory={result.data.history}
        initialStudents={result.data.students}
        teacherName={profileResult.profile.nama_lengkap}
      />
    )
  }
  if (role !== 'admin') {
    return (
      <AttendanceMessage>
        Riwayat presensi hanya tersedia untuk admin, guru, dan siswa.
      </AttendanceMessage>
    )
  }

  const result = await getAdminAttendancePageData(today)

  if (result.status === 'error') {
    return <AttendanceMessage>{result.message}</AttendanceMessage>
  }

  return (
    <AdminAttendanceHistory
      classes={result.data.classes}
      date={today}
      hasMore={result.data.history.hasMore}
      initialError={result.data.historyError}
      records={result.data.history.records}
    />
  )
}

function getTodayInJakarta() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())
  const dateParts = Object.fromEntries(
    parts.map(({ type, value }) => [type, value]),
  )

  return `${dateParts.year}-${dateParts.month}-${dateParts.day}`
}

function AttendanceMessage({ children }: { children: string }) {
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

function AttendanceFallback() {
  return (
    <div
      aria-busy="true"
      className="rounded-2xl border border-[#e5ebe7] bg-white p-6 text-sm text-[#65736a] dark:border-[#616161] dark:bg-[#1c2d35] dark:text-[#c5c2ba]"
      role="status"
    >
      Memuat presensi…
    </div>
  )
}
