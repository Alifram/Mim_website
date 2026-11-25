import { createClient } from '@/lib/supabase/server'

import {
  parseTeacherGradeAssignments,
  parseTeacherGradeStudents,
  type TeacherGradeAssignment,
  type TeacherGradeStudent,
} from './teacher-grade-types'

export type TeacherGradeAssignmentsResult =
  | { status: 'success'; assignments: TeacherGradeAssignment[] }
  | { status: 'error'; message: string }

export type TeacherGradeStudentsResult =
  | { status: 'success'; students: TeacherGradeStudent[] }
  | { status: 'error'; message: string }

export async function getTeacherGradeAssignments(): Promise<TeacherGradeAssignmentsResult> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('get_teacher_grade_assignments')

  if (error) {
    return {
      status: 'error',
      message:
        error.code === '42501'
          ? 'Penugasan nilai hanya tersedia untuk guru aktif.'
          : 'Penugasan mapel belum dapat dimuat. Periksa koneksi dan coba lagi.',
    }
  }

  const assignments = parseTeacherGradeAssignments(data)
  if (!assignments) {
    return {
      status: 'error',
      message: 'Format penugasan mapel dari server tidak valid.',
    }
  }

  return { status: 'success', assignments }
}

export async function getTeacherGradeStudents(
  classId: number,
): Promise<TeacherGradeStudentsResult> {
  if (!Number.isSafeInteger(classId) || classId <= 0) {
    return { status: 'error', message: 'ID kelas tidak valid.' }
  }

  const supabase = await createClient()
  const { data, error } = await supabase.rpc('get_grade_students', {
    p_kelas_id: classId,
  })

  if (error) {
    return {
      status: 'error',
      message:
        error.code === '42501'
          ? 'Guru tidak memiliki penugasan aktif untuk kelas ini.'
          : 'Daftar siswa belum dapat dimuat. Periksa koneksi dan coba lagi.',
    }
  }

  const students = parseTeacherGradeStudents(data)
  if (!students) {
    return {
      status: 'error',
      message: 'Format daftar siswa dari server tidak valid.',
    }
  }

  return { status: 'success', students }
}
