'use client'

import { createClient } from '@/lib/supabase/client'

export type CreateAssignmentResult =
  | { status: 'success'; message: string }
  | { status: 'error'; message: string }

export async function createClassSubjectAssignment({
  classId,
  subjectId,
  teacherId,
  schoolYear,
}: {
  classId: number
  subjectId: number
  teacherId: number
  schoolYear: string
}): Promise<CreateAssignmentResult> {
  if (
    !Number.isSafeInteger(classId) ||
    classId <= 0 ||
    !Number.isSafeInteger(subjectId) ||
    subjectId <= 0 ||
    !Number.isSafeInteger(teacherId) ||
    teacherId <= 0 ||
    !/^\d{4}\/\d{4}$/.test(schoolYear) ||
    Number(schoolYear.slice(5)) !== Number(schoolYear.slice(0, 4)) + 1
  ) {
    return {
      status: 'error',
      message: 'Pilih kelas, mapel, guru, dan tahun ajaran yang valid.',
    }
  }

  try {
    const supabase = createClient()
    const { data, error } = await supabase.rpc(
      'admin_create_class_subject_assignment',
      {
        p_kelas_id: classId,
        p_mata_pelajaran_id: subjectId,
        p_guru_id: teacherId,
        p_tahun_ajaran: schoolYear,
      },
    )

    if (error) {
      if (error.code === '23505') {
        return {
          status: 'error',
          message:
            'Penugasan kelas dan mata pelajaran untuk tahun ajaran tersebut sudah ada.',
        }
      }
      if (error.code === '42501') {
        return {
          status: 'error',
          message: 'Hanya admin aktif yang dapat menambahkan penugasan.',
        }
      }
      if (error.code === '22023') {
        return {
          status: 'error',
          message:
            'Data kelas, mapel, guru, atau tahun ajaran tidak valid. Periksa pilihan Anda.',
        }
      }
      return {
        status: 'error',
        message:
          'Penugasan belum berhasil disimpan. Periksa koneksi dan konfigurasi Supabase.',
      }
    }

    if (
      typeof data !== 'object' ||
      data === null ||
      Array.isArray(data) ||
      !('status' in data) ||
      data.status !== 'success'
    ) {
      return {
        status: 'error',
        message: 'Respons penyimpanan penugasan dari server tidak valid.',
      }
    }

    return {
      status: 'success',
      message:
        'message' in data && typeof data.message === 'string'
          ? data.message
          : 'Penugasan mapel berhasil ditambahkan.',
    }
  } catch {
    return {
      status: 'error',
      message: 'Penugasan belum berhasil disimpan. Periksa koneksi lalu coba lagi.',
    }
  }
}
