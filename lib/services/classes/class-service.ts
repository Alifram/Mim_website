import { createClient } from '@/lib/supabase/server'

export type AdminStudent = {
  id: number
  nomor_induk: string
  nama_lengkap: string
  kelas_id: number | null
  kelas_nama: string | null
  tahun_angkatan: number | null
}

export type AdminStudentRosterResult =
  | { status: 'success'; students: AdminStudent[] }
  | { status: 'error'; message: string }

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function parseNullableInteger(value: unknown) {
  if (value === null) return null
  if (typeof value === 'number' && Number.isSafeInteger(value)) return value
  return undefined
}

function parseNullableString(value: unknown) {
  if (value === null) return null
  if (typeof value === 'string') return value
  return undefined
}

export async function getAdminStudentRoster(): Promise<AdminStudentRosterResult> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('get_admin_users')

  if (error || !isRecord(data) || data.status !== 'success' || !Array.isArray(data.data)) {
    return {
      status: 'error',
      message: 'Data siswa belum dapat dimuat. Pastikan akun admin aktif dan akses Supabase tersedia.',
    }
  }

  const students: AdminStudent[] = []

  for (const row of data.data) {
    if (!isRecord(row)) {
      return {
        status: 'error',
        message: 'Format data siswa dari server tidak valid.',
      }
    }

    const id = parseNullableInteger(row.id)
    const kelasId = parseNullableInteger(row.kelas_id)
    const tahunAngkatan = parseNullableInteger(row.tahun_angkatan)
    const kelasNama = parseNullableString(row.kelas_nama)
    const deletedStatus = parseNullableInteger(row.is_deleted)

    if (
      id === null ||
      id === undefined ||
      typeof row.role !== 'string' ||
      typeof row.nomor_induk !== 'string' ||
      typeof row.nama_lengkap !== 'string' ||
      kelasId === undefined ||
      kelasNama === undefined ||
      tahunAngkatan === undefined ||
      deletedStatus === null ||
      deletedStatus === undefined
    ) {
      return {
        status: 'error',
        message: 'Format data siswa dari server tidak lengkap.',
      }
    }

    if (row.role === 'siswa' && deletedStatus === 0) {
      students.push({
        id,
        nomor_induk: row.nomor_induk,
        nama_lengkap: row.nama_lengkap,
        kelas_id: kelasId,
        kelas_nama: kelasNama,
        tahun_angkatan: tahunAngkatan,
      })
    }
  }

  return { status: 'success', students }
}
