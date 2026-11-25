'use client'

import { createClient } from '@/lib/supabase/client'

import { isRecord } from './academic-statistics-types'

export type StudentPromotionResult =
  | { status: 'success'; movedCounts: number[] }
  | { status: 'error'; message: string }

export async function promoteStudents(): Promise<StudentPromotionResult> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase.rpc('admin_promote_students')

    if (error) {
      return {
        status: 'error',
        message:
          error.code === '42501'
            ? 'Kenaikan kelas massal hanya dapat dilakukan oleh admin aktif.'
            : error.code === '22023'
              ? 'Periksa kelas aktif. Kelas 1 sampai 6 harus tersedia tepat satu, dan kelas Alumni tidak boleh ganda.'
              : 'Kenaikan kelas massal belum berhasil. Periksa koneksi dan coba lagi.',
      }
    }

    if (
      !isRecord(data) ||
      data.status !== 'success' ||
      !Array.isArray(data.jumlah_dipindah) ||
      !data.jumlah_dipindah.every(
        (count) => Number.isSafeInteger(count) && count >= 0,
      )
    ) {
      return {
        status: 'error',
        message: 'Respons kenaikan kelas dari server tidak valid.',
      }
    }

    return { status: 'success', movedCounts: data.jumlah_dipindah }
  } catch {
    return {
      status: 'error',
      message: 'Kenaikan kelas massal belum berhasil. Periksa koneksi dan coba lagi.',
    }
  }
}
