'use client'

import { createClient } from '@/lib/supabase/client'

import {
  isRecord,
  parseAcademicStatistics,
  type AcademicClassStatistics,
} from './academic-statistics-types'

export type AcademicStatisticsQueryResult =
  | { status: 'success'; statistics: AcademicClassStatistics[] }
  | { status: 'error'; message: string }

export async function fetchAcademicStatistics(
  admissionYear: number,
): Promise<AcademicStatisticsQueryResult> {
  if (!Number.isSafeInteger(admissionYear) || admissionYear < 2000) {
    return {
      status: 'error',
      message: 'Tahun angkatan yang dipilih tidak valid.',
    }
  }

  try {
    const supabase = createClient()
    const { data, error } = await supabase.rpc('get_academic_statistics', {
      p_admission_year: admissionYear,
    })

    if (error) {
      return {
        status: 'error',
        message:
          error.code === '42501'
            ? 'Statistik hanya tersedia untuk admin dan guru aktif.'
            : error.code === '22023'
              ? 'Tahun angkatan yang dipilih tidak valid.'
              : 'Statistik akademik belum dapat dimuat. Periksa koneksi lalu coba lagi.',
      }
    }

    if (!isRecord(data) || data.status !== 'success') {
      return {
        status: 'error',
        message: 'Respons statistik akademik dari server tidak valid.',
      }
    }

    const statistics = parseAcademicStatistics(data.data)
    if (!statistics) {
      return {
        status: 'error',
        message: 'Format statistik akademik dari server tidak valid.',
      }
    }

    return { status: 'success', statistics }
  } catch {
    return {
      status: 'error',
      message: 'Statistik akademik belum dapat dimuat. Periksa koneksi lalu coba lagi.',
    }
  }
}
