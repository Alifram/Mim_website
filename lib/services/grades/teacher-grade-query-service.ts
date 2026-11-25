'use client'

import { createClient } from '@/lib/supabase/client'

import {
  isGradeKind,
  isGradeSemester,
  isRecord,
  parseTeacherGradeAssignments,
  parseTeacherGradeStudents,
  type GradeSubmission,
  type TeacherGradeAssignment,
  type TeacherGradeStudent,
} from './teacher-grade-types'

export type TeacherGradeQueryResult<T> =
  | { status: 'success'; data: T }
  | { status: 'error'; message: string }

function getRpcErrorMessage(
  code: string | undefined,
  action: 'assignments' | 'students' | 'save',
  kind?: GradeSubmission['kind'],
) {
  if (
    code === '23505' &&
    action === 'save' &&
    (kind === 'uts' || kind === 'uas')
  ) {
    return `Nilai ${kind.toUpperCase()} untuk siswa, mapel, dan semester ini sudah pernah disimpan. Nilai hanya dapat diinput satu kali.`
  }
  if (code === 'PGRST202' && action === 'save' && kind === 'harian') {
    return 'Fitur nilai harian belum tersedia di database. Terapkan migrasi save_daily_assessment_grade, lalu coba lagi.'
  }
  if (code === '23505' && action === 'save' && kind === 'harian') {
    return 'Penilaian harian ini terdeteksi duplikat. Periksa riwayat penilaian sebelum mencoba lagi.'
  }
  if (code === '42501') {
    return action === 'save'
      ? 'Anda tidak memiliki akses ke penugasan atau siswa yang dipilih.'
      : 'Data hanya tersedia untuk guru aktif dengan penugasan yang sesuai.'
  }
  if (code === '22023') {
    return 'Data nilai tidak valid. Periksa kembali semester, jenis penilaian, nama, tanggal, dan skor.'
  }
  if (action === 'assignments') {
    return 'Penugasan mapel belum dapat dimuat. Periksa koneksi lalu coba lagi.'
  }
  if (action === 'students') {
    return 'Daftar siswa belum dapat dimuat. Periksa koneksi lalu coba lagi.'
  }
  if (action === 'save' && code) {
    return `Server menolak penyimpanan nilai (kode ${code}). Hubungi admin jika masalah berlanjut.`
  }
  return 'Nilai belum berhasil disimpan. Periksa koneksi lalu coba lagi.'
}

export async function fetchTeacherGradeAssignments(): Promise<
  TeacherGradeQueryResult<TeacherGradeAssignment[]>
> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase.rpc('get_teacher_grade_assignments')
    if (error) {
      return {
        status: 'error',
        message: getRpcErrorMessage(error.code, 'assignments'),
      }
    }

    const assignments = parseTeacherGradeAssignments(data)
    if (!assignments) {
      return {
        status: 'error',
        message: 'Format penugasan mapel dari server tidak valid.',
      }
    }
    return { status: 'success', data: assignments }
  } catch {
    return {
      status: 'error',
      message: getRpcErrorMessage(undefined, 'assignments'),
    }
  }
}

export async function fetchTeacherGradeStudents(
  classId: number,
): Promise<TeacherGradeQueryResult<TeacherGradeStudent[]>> {
  if (!Number.isSafeInteger(classId) || classId <= 0) {
    return { status: 'error', message: 'ID kelas tidak valid.' }
  }

  try {
    const supabase = createClient()
    const { data, error } = await supabase.rpc('get_grade_students', {
      p_kelas_id: classId,
    })
    if (error) {
      return {
        status: 'error',
        message: getRpcErrorMessage(error.code, 'students'),
      }
    }

    const students = parseTeacherGradeStudents(data)
    if (!students) {
      return {
        status: 'error',
        message: 'Format daftar siswa dari server tidak valid.',
      }
    }
    return { status: 'success', data: students }
  } catch {
    return {
      status: 'error',
      message: getRpcErrorMessage(undefined, 'students'),
    }
  }
}

export async function saveTeacherGrade(
  submission: GradeSubmission,
): Promise<TeacherGradeQueryResult<string>> {
  const {
    studentId,
    assignmentId,
    semester,
    kind,
    score,
    comment,
    assessmentName,
    assessmentDate,
  } = submission

  if (
    !Number.isSafeInteger(studentId) ||
    studentId <= 0 ||
    !Number.isSafeInteger(assignmentId) ||
    assignmentId <= 0 ||
    !isGradeSemester(semester) ||
    !isGradeKind(kind) ||
    !Number.isInteger(score) ||
    score < 0 ||
    score > 100 ||
    comment.length > 1000 ||
    (kind === 'harian' &&
      (!assessmentName.trim() ||
        assessmentName.trim().length > 100 ||
        !/^\d{4}-\d{2}-\d{2}$/.test(assessmentDate)))
  ) {
    return {
      status: 'error',
      message: 'Periksa kembali data siswa, mapel, semester, dan nilai.',
    }
  }

  try {
    const supabase = createClient()
    const isDailyGrade = kind === 'harian'
    const { data, error } = await supabase.rpc(
      isDailyGrade ? 'save_daily_assessment_grade' : 'save_legacy_grade',
      isDailyGrade
        ? {
            p_siswa_id: studentId,
            p_kelas_mapel_id: assignmentId,
            p_semester: semester,
            p_nama_penilaian: assessmentName.trim(),
            p_tanggal_penilaian: assessmentDate,
            p_skor_nilai: score,
            p_keterangan: comment.trim() || null,
          }
        : {
            p_siswa_id: studentId,
            p_kelas_mapel_id: assignmentId,
            p_semester: semester,
            p_jenis_nilai: kind,
            p_skor_nilai: score,
            p_keterangan: comment.trim() || null,
          },
    )

    if (error) {
      return {
        status: 'error',
        message: getRpcErrorMessage(error.code, 'save', kind),
      }
    }
    if (!isRecord(data) || data.status !== 'success') {
      return {
        status: 'error',
        message: 'Respons penyimpanan nilai dari server tidak valid.',
      }
    }

    return {
      status: 'success',
      data:
        typeof data.message === 'string'
          ? data.message
          : 'Nilai berhasil disimpan.',
    }
  } catch {
    return {
      status: 'error',
      message: getRpcErrorMessage(undefined, 'save'),
    }
  }
}
