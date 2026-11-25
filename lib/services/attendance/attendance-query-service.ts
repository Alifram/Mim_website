'use client'

import { createClient } from '@/lib/supabase/client'

import {
  attendanceStatuses,
  parseAttendanceHistory,
  parseAttendanceStudents,
  type AttendanceStatus,
  type AttendanceHistory,
  type AttendanceStudent,
} from './attendance-types'

export type AttendanceHistoryResult =
  | { status: 'success'; history: AttendanceHistory }
  | { status: 'error'; message: string }

export type TeacherAttendanceData = {
  students: AttendanceStudent[]
  history: AttendanceHistory
}

export type TeacherAttendanceDataResult =
  | { status: 'success'; data: TeacherAttendanceData }
  | { status: 'error'; message: string }

export type AttendanceSubmission = {
  siswa_id: number
  status: AttendanceStatus
  catatan: string
}

export type SaveAttendanceResult =
  | { status: 'success' }
  | { status: 'error'; message: string }

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function attendanceErrorMessage(code: string | undefined) {
  if (code === '42501') return 'Hanya akun admin aktif yang dapat melihat seluruh presensi.'
  if (code === '22023') return 'Tanggal atau kelas yang dipilih tidak valid.'
  return 'Riwayat presensi belum dapat dimuat. Periksa koneksi lalu coba lagi.'
}

function teacherAttendanceErrorMessage(code: string | undefined) {
  if (code === '42501') return 'Anda hanya dapat mengisi presensi untuk kelas sendiri.'
  if (code === '22023') return 'Data presensi tidak valid atau tanggal pengisian bukan hari ini.'
  return 'Presensi belum dapat diproses. Periksa koneksi lalu coba lagi.'
}

export async function fetchTeacherAttendanceData(
  date: string,
  classId: number,
): Promise<TeacherAttendanceDataResult> {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    !Number.isSafeInteger(classId) ||
    classId <= 0
  ) {
    return {
      status: 'error',
      message: 'Tanggal atau kelas yang dipilih tidak valid.',
    }
  }

  try {
    const supabase = createClient()
    const [studentsResult, historyResult] = await Promise.all([
      supabase.rpc('get_attendance_students', { p_kelas_id: classId }),
      supabase.rpc('get_attendance', {
        p_tanggal: date,
        p_kelas_id: classId,
      }),
    ])

    if (studentsResult.error) {
      return {
        status: 'error',
        message: teacherAttendanceErrorMessage(studentsResult.error.code),
      }
    }
    if (historyResult.error) {
      return {
        status: 'error',
        message: teacherAttendanceErrorMessage(historyResult.error.code),
      }
    }

    const students = parseAttendanceStudents(studentsResult.data)
    const history = parseAttendanceHistory(historyResult.data)
    if (!students || !history) {
      return {
        status: 'error',
        message: 'Format data presensi dari server tidak valid.',
      }
    }
    if (history.hasMore) {
      return {
        status: 'error',
        message:
          'Data presensi sebelumnya melebihi batas 500 catatan dan tidak dapat dimuat dengan aman.',
      }
    }

    return {
      status: 'success',
      data: { students, history },
    }
  } catch {
    return {
      status: 'error',
      message: 'Presensi belum dapat dimuat. Periksa koneksi lalu coba lagi.',
    }
  }
}

export async function saveTeacherAttendance(
  date: string,
  classId: number,
  entries: AttendanceSubmission[],
): Promise<SaveAttendanceResult> {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    !Number.isSafeInteger(classId) ||
    classId <= 0 ||
    entries.length === 0 ||
    entries.some(
      (entry) =>
        !Number.isSafeInteger(entry.siswa_id) ||
        entry.siswa_id <= 0 ||
        !attendanceStatuses.includes(entry.status) ||
        entry.catatan.length > 200,
    ) ||
    new Set(entries.map((entry) => entry.siswa_id)).size !== entries.length
  ) {
    return {
      status: 'error',
      message: 'Data presensi tidak lengkap atau tidak valid.',
    }
  }

  try {
    const supabase = createClient()
    const { data, error } = await supabase.rpc('save_attendance', {
      p_kelas_id: classId,
      p_tanggal: date,
      p_presensi: entries,
    })

    if (error) {
      return {
        status: 'error',
        message: teacherAttendanceErrorMessage(error.code),
      }
    }
    if (!isRecord(data) || data.status !== 'success') {
      return {
        status: 'error',
        message: 'Server tidak mengonfirmasi penyimpanan presensi.',
      }
    }

    return { status: 'success' }
  } catch {
    return {
      status: 'error',
      message: 'Presensi belum dapat disimpan. Periksa koneksi lalu coba lagi.',
    }
  }
}

export async function fetchAdminAttendanceHistory(
  date: string,
  classId: number | null,
): Promise<AttendanceHistoryResult> {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    (classId !== null && (!Number.isSafeInteger(classId) || classId <= 0))
  ) {
    return {
      status: 'error',
      message: 'Tanggal atau kelas yang dipilih tidak valid.',
    }
  }

  try {
    const supabase = createClient()
    const { data, error } = await supabase.rpc('get_attendance', {
      p_tanggal: date,
      p_kelas_id: classId,
    })

    if (error) {
      return { status: 'error', message: attendanceErrorMessage(error.code) }
    }

    const history = parseAttendanceHistory(data)
    if (!history) {
      return {
        status: 'error',
        message: 'Format riwayat presensi dari server tidak valid.',
      }
    }

    return { status: 'success', history }
  } catch {
    return {
      status: 'error',
      message: 'Riwayat presensi belum dapat dimuat. Periksa koneksi lalu coba lagi.',
    }
  }
}
