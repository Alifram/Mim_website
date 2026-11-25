'use client'

import { createClient } from '@/lib/supabase/client'

export type AddSubjectResult =
  | { status: 'success'; message: string }
  | { status: 'error'; message: string }

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
