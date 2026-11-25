import { createClient } from '@/lib/supabase/server'

export type SchoolSubject = {
  id: number
  kode: string
  nama: string
}

export type SchoolSubjectsResult =
  | { status: 'success'; subjects: SchoolSubject[] }
  | { status: 'error'; message: string }

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export async function getActiveSchoolSubjects(): Promise<SchoolSubjectsResult> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('mata_pelajaran')
    .select('id, kode, nama')
    .eq('aktif', true)
    .order('nama')

  if (error || !Array.isArray(data)) {
    return {
      status: 'error',
      message:
        'Daftar mata pelajaran belum dapat dimuat. Periksa akses Supabase lalu coba lagi.',
    }
  }

  const subjects: SchoolSubject[] = []

  for (const row of data) {
    if (
      !isRecord(row) ||
      typeof row.id !== 'number' ||
      !Number.isSafeInteger(row.id) ||
      typeof row.kode !== 'string' ||
      typeof row.nama !== 'string'
    ) {
      return {
        status: 'error',
        message: 'Format daftar mata pelajaran dari server tidak valid.',
      }
    }

    subjects.push({ id: row.id, kode: row.kode, nama: row.nama })
  }

  return { status: 'success', subjects }
}
