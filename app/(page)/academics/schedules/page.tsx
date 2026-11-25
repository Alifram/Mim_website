import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { connection } from 'next/server'

import ScheduleManagement from '@/components/schedules/schedule-management'
import StudentScheduleView from '@/components/schedules/student-schedule-view'
import TeacherScheduleView from '@/components/schedules/teacher-schedule-view'
import { getCurrentProfile } from '@/lib/services/auth/auth-server-service'
import { getAdminAssignmentData } from '@/lib/services/assignments/assignment-service'
import {
  getAdminSchedule,
  getMySchedule,
} from '@/lib/services/schedules/schedule-service'
import {
  scheduleDays,
  type ScheduleDay,
} from '@/lib/services/schedules/schedule-types'

const initialDay: ScheduleDay = 'Senin'

export default function SchedulesPage() {
  return (
    <Suspense fallback={<SchedulesFallback />}>
      <SchedulesContent />
    </Suspense>
  )
}

async function SchedulesContent() {
  await connection()
  const profileResult = await getCurrentProfile()

  if (profileResult.status === 'unauthenticated') {
    redirect('/login')
  }
  if (profileResult.status !== 'authenticated') {
    return (
      <SchedulesMessage>
        Profil sekolah tidak dapat dimuat. Periksa koneksi dan kebijakan akses.
      </SchedulesMessage>
    )
  }

  const role = profileResult.profile.role.trim().toLowerCase()
  if (role === 'guru') {
    const result = await getMySchedule(initialDay)
    return (
      <TeacherScheduleView
        initialDay={initialDay}
        initialSchedules={
          result.status === 'success' ? result.schedules : []
        }
        initialScheduleError={
          result.status === 'error' ? result.message : null
        }
        teacherName={profileResult.profile.nama_lengkap}
      />
    )
  }
  if (role === 'siswa') {
    if (!profileResult.profile.kelas_id) {
      return (
        <SchedulesMessage>
          Akun siswa belum terhubung ke kelas. Hubungi admin untuk memeriksa
          profil Anda.
        </SchedulesMessage>
      )
    }

    const currentDay = getCurrentScheduleDay()
    const result = await getMySchedule(currentDay)
    return (
      <StudentScheduleView
        currentDay={currentDay}
        initialDay={currentDay}
        initialScheduleError={result.status === 'error' ? result.message : null}
        initialSchedules={
          result.status === 'success' ? result.schedules : []
        }
        studentName={profileResult.profile.nama_lengkap}
        studentNumber={profileResult.profile.nomor_induk}
      />
    )
  }
  if (role !== 'admin') {
    return (
      <SchedulesMessage>
        Jadwal pelajaran hanya tersedia untuk admin, guru, dan siswa.
      </SchedulesMessage>
    )
  }

  const assignmentResult = await getAdminAssignmentData()
  if (assignmentResult.status === 'error') {
    return <SchedulesMessage>{assignmentResult.message}</SchedulesMessage>
  }

  const { classes, assignments } = assignmentResult.data
  const initialClassId = classes[0]?.id ?? null
  const scheduleResult = initialClassId
    ? await getAdminSchedule(initialClassId, initialDay)
    : null

  return (
    <ScheduleManagement
      assignments={assignments}
      classes={classes}
      initialClassId={initialClassId}
      initialDay={initialDay}
      initialScheduleError={
        scheduleResult?.status === 'error' ? scheduleResult.message : null
      }
      initialSchedules={
        scheduleResult?.status === 'success' ? scheduleResult.schedules : []
      }
    />
  )
}

function getCurrentScheduleDay(): ScheduleDay {
  const weekday = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    timeZone: 'Asia/Jakarta',
  }).format(new Date())
  const normalizedWeekday =
    weekday.charAt(0).toUpperCase() + weekday.slice(1).toLowerCase()

  return scheduleDays.find((day) => day === normalizedWeekday) ?? initialDay
}

function SchedulesMessage({ children }: { children: string }) {
  return (
    <p
      className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-6 text-amber-900 dark:border-[#795d23] dark:bg-[#3b3020] dark:text-[#ffe0a3]"
      role="alert"
    >
      {children}
    </p>
  )
}

function SchedulesFallback() {
  return (
    <div
      aria-busy="true"
      className="rounded-2xl border border-[#e5ebe7] bg-white p-6 text-sm text-[#65736a] dark:border-[#616161] dark:bg-[#1c2d35] dark:text-[#c5c2ba]"
      role="status"
    >
      Memuat jadwal pelajaran…
    </div>
  )
}
