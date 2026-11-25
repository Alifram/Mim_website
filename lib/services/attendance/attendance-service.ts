import { createClient } from '@/lib/supabase/server'

import {
  parseAttendanceClasses,
  parseAttendanceHistory,
  parseAttendanceStudents,
  type AttendanceClass,
  type AttendanceHistory,
  type AttendanceStudent,
} from './attendance-types'

export type AdminAttendancePageData = {
  classes: AttendanceClass[]
  history: AttendanceHistory
  historyError: string | null
}

export type AdminAttendancePageResult =
  | { status: 'success'; data: AdminAttendancePageData }
  | { status: 'error'; message: string }

export type TeacherAttendancePageData = {
  className: string
  students: AttendanceStudent[]
  history: AttendanceHistory
}

export type TeacherAttendancePageResult =
  | { status: 'success'; data: TeacherAttendancePageData }
  | { status: 'error'; message: string }

export type StudentAttendancePageResult =
  | { status: 'success'; history: AttendanceHistory }
  | { status: 'error'; message: string }

export async function getStudentAttendancePageData(): Promise<StudentAttendancePageResult> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('get_attendance', {
    p_tanggal: null,
    p_kelas_id: null,
  })

  if (error) {
    return {
      status: 'error',
      message:
        error.code === '42501'
          ? 'Riwayat presensi hanya tersedia untuk siswa aktif yang sudah terhubung ke kelas.'
          : 'Riwayat presensi belum dapat dimuat. Periksa koneksi lalu coba lagi.',
    }
  }

  const history = parseAttendanceHistory(data)
  if (!history) {
    return {
      status: 'error',
      message: 'Format riwayat presensi dari server tidak valid.',
    }
  }

  return { status: 'success', history }
}

export async function getTeacherAttendancePageData(
  classId: number,
  date: string,
): Promise<TeacherAttendancePageResult> {
  if (
    !Number.isSafeInteger(classId) ||
    classId <= 0 ||
    !/^\d{4}-\d{2}-\d{2}$/.test(date)
  ) {
    return {
      status: 'error',
      message: 'Kelas atau tanggal presensi tidak valid.',
    }
  }

  const supabase = await createClient()
  const [classResult, studentsResult, historyResult] = await Promise.all([
    supabase
      .from('kelas')
      .select('id, nama')
      .eq('id', classId)
      .eq('aktif', true)
      .maybeSingle(),
    supabase.rpc('get_attendance_students', { p_kelas_id: classId }),
    supabase.rpc('get_attendance', {
      p_tanggal: date,
      p_kelas_id: classId,
    }),
  ])

  if (classResult.error || !classResult.data) {
    return {
      status: 'error',
      message: 'Kelas guru belum dapat dimuat. Hubungi admin untuk memeriksa kelas akun.',
    }
  }

  const classes = parseAttendanceClasses([classResult.data])
  const students = parseAttendanceStudents(studentsResult.data)
  const history = parseAttendanceHistory(historyResult.data)

  if (!classes || !students) {
    return {
      status: 'error',
      message: studentsResult.error
        ? 'Daftar siswa belum dapat dimuat. Pastikan kelas akun guru aktif.'
        : 'Format daftar siswa dari server tidak valid.',
    }
  }
  if (!history || historyResult.error) {
    return {
      status: 'error',
      message: historyResult.error
        ? 'Presensi sebelumnya belum dapat dimuat. Coba lagi sebelum mengisi.'
        : 'Format presensi sebelumnya dari server tidak valid.',
    }
  }
  if (history.hasMore) {
    return {
      status: 'error',
      message:
        'Daftar presensi melebihi batas 500 catatan, sehingga data sebelumnya tidak dapat dipastikan lengkap.',
    }
  }

  return {
    status: 'success',
    data: {
      className: classes[0].nama,
      students,
      history,
    },
  }
}

export async function getAdminAttendancePageData(
  date: string,
): Promise<AdminAttendancePageResult> {
  const supabase = await createClient()
  const [classResult, historyResult] = await Promise.all([
    supabase.from('kelas').select('id, nama').eq('aktif', true).order('nama'),
    supabase.rpc('get_attendance', {
      p_tanggal: date,
      p_kelas_id: null,
    }),
  ])

  if (classResult.error) {
    return {
      status: 'error',
      message: 'Daftar kelas belum dapat dimuat. Periksa akses Supabase lalu coba lagi.',
    }
  }

  const classes = parseAttendanceClasses(classResult.data)
  if (!classes) {
    return {
      status: 'error',
      message: 'Format daftar kelas dari server tidak valid.',
    }
  }

  if (historyResult.error) {
    return {
      status: 'success',
      data: {
        classes,
        history: { records: [], hasMore: false },
        historyError:
          'Riwayat presensi belum dapat dimuat. Pastikan RPC Supabase tersedia dan akun admin aktif.',
      },
    }
  }

  const history = parseAttendanceHistory(historyResult.data)
  if (!history) {
    return {
      status: 'success',
      data: {
        classes,
        history: { records: [], hasMore: false },
        historyError: 'Format riwayat presensi dari server tidak valid.',
      },
    }
  }

  return {
    status: 'success',
    data: { classes, history, historyError: null },
  }
}
