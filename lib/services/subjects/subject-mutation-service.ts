'use client'

import { createClient } from '@/lib/supabase/client'

export type AddSubjectResult =
  | { status: 'success'; message: string }
  | { status: 'error'; message: string }

export type SetSubjectActiveResult =
  | { status: 'success'; message: string }
  | { status: 'error'; message: string }

function isSuccessResponse(value: unknown): boolean {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    'status' in value &&
    value.status === 'success'
  )
}

export async function addSchoolSubject(
  code: string,
  name: string,
): Promise<AddSubjectResult> {
  const normalizedCode = code.trim().toUpperCase()
  const normalizedName = name.trim()

  if (
    !normalizedCode ||
    normalizedCode.length > 30 ||
    !normalizedName ||
    normalizedName.length > 100
  ) {
    return {
      status: 'error',
      message: 'Kode dan nama wajib diisi sesuai batas panjang yang ditentukan.',
    }
  }

  try {
    const supabase = createClient()
    const { error } = await supabase.from('mata_pelajaran').insert({
      kode: normalizedCode,
      nama: normalizedName,
      aktif: true,
    })

    if (error?.code === '23505') {
      return {
        status: 'error',
        message: 'Kode atau nama mata pelajaran sudah digunakan.',
      }
    }
    if (error) {
      return {
        status: 'error',
        message:
          'Mata pelajaran belum berhasil disimpan. Pastikan Anda masuk sebagai admin dan kebijakan Supabase sudah diterapkan.',
      }
    }

    return { status: 'success', message: 'Mata pelajaran berhasil ditambahkan.' }
  } catch {
    return {
      status: 'error',
      message: 'Mata pelajaran belum berhasil disimpan. Periksa koneksi lalu coba lagi.',
    }
  }
}

export async function setSchoolSubjectActive(
  subjectId: number,
  active: boolean,
): Promise<SetSubjectActiveResult> {
  if (!Number.isSafeInteger(subjectId) || subjectId <= 0) {
    return { status: 'error', message: 'ID mata pelajaran tidak valid.' }
  }

  try {
    const supabase = createClient()
    const { data, error } = await supabase.rpc('admin_set_subject_active', {
      p_subject_id: subjectId,
      p_active: active,
    })

    if (error) {
      return {
        status: 'error',
        message:
          error.code === '42501'
            ? 'Hanya admin aktif yang dapat mengelola mata pelajaran.'
            : error.code === 'P0002'
              ? 'Mata pelajaran tidak ditemukan.'
              : 'Status mata pelajaran belum berhasil diperbarui. Periksa migrasi dan koneksi.',
      }
    }

    if (!isSuccessResponse(data)) {
      return {
        status: 'error',
        message: 'Server tidak mengonfirmasi perubahan mata pelajaran.',
      }
    }

    return {
      status: 'success',
      message: active
        ? 'Mata pelajaran berhasil diaktifkan.'
        : 'Mata pelajaran berhasil dinonaktifkan.',
    }
  } catch {
    return {
      status: 'error',
      message: 'Status mata pelajaran belum berhasil diperbarui. Periksa koneksi lalu coba lagi.',
    }
  }
}
