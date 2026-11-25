import { createClient } from '@/lib/supabase/server'

export type AdminStudent = {
  id: number
  nomor_induk: string
  nama_lengkap: string
  kelas_id: number | null
  kelas_nama: string | null
  tahun_angkatan: number | null
}

export type AdminMonitoringUser = {
  id: number
  nomor_induk: string
  nama_lengkap: string
  kelas_id: number | null
  role: 'guru' | 'siswa'
  jenis_guru: string | null
  kelas_nama: string | null
  kelas_mapel_nama: string[]
  tahun_angkatan: number | null
  is_deleted: number
}

export type AdminStudentRosterResult =
  | { status: 'success'; students: AdminStudent[] }
  | { status: 'error'; message: string }

export type AdminMonitoringUsersResult =
  | { status: 'success'; users: AdminMonitoringUser[] }
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

function parseAdminMonitoringUsers(value: unknown) {
  if (!isRecord(value) || value.status !== 'success' || !Array.isArray(value.data)) {
    return null
  }

  const users: AdminMonitoringUser[] = []

  for (const row of value.data) {
    if (!isRecord(row)) return null
    if (row.role !== 'guru' && row.role !== 'siswa') continue

    const id = parseNullableInteger(row.id)
    const kelasId = parseNullableInteger(row.kelas_id)
    const kelasNama = parseNullableString(row.kelas_nama)
    const tahunAngkatan = parseNullableInteger(row.tahun_angkatan)
    const deletedStatus = parseNullableInteger(row.is_deleted)
    const jenisGuru = parseNullableString(row.jenis_guru)
    const rawKelasMapelNama = row.kelas_mapel_nama
    const kelasMapelNama =
      rawKelasMapelNama === undefined || rawKelasMapelNama === null
        ? []
        : rawKelasMapelNama

    if (
      id === null ||
      id === undefined ||
      typeof row.nomor_induk !== 'string' ||
      typeof row.nama_lengkap !== 'string' ||
      kelasId === undefined ||
      kelasNama === undefined ||
      tahunAngkatan === undefined ||
      deletedStatus === null ||
      deletedStatus === undefined ||
      jenisGuru === undefined ||
      !Array.isArray(kelasMapelNama) ||
      !kelasMapelNama.every((name) => typeof name === 'string')
    ) {
      return null
    }

    users.push({
      id,
      nomor_induk: row.nomor_induk,
      nama_lengkap: row.nama_lengkap,
      kelas_id: kelasId,
      role: row.role,
      jenis_guru: jenisGuru,
      kelas_nama: kelasNama,
      kelas_mapel_nama: kelasMapelNama,
      tahun_angkatan: tahunAngkatan,
      is_deleted: deletedStatus,
    })
  }

  return users
}

export async function getAdminMonitoringUsers(): Promise<AdminMonitoringUsersResult> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('get_admin_users')

  if (error) {
    return {
      status: 'error',
      message: 'Data pantauan belum dapat dimuat. Pastikan akun admin aktif dan akses Supabase tersedia.',
    }
  }

  const users = parseAdminMonitoringUsers(data)
  if (!users) {
    return {
      status: 'error',
      message: 'Format data pantauan dari server tidak valid.',
    }
  }

  return { status: 'success', users }
}

export async function getAdminStudentRoster(): Promise<AdminStudentRosterResult> {
  const result = await getAdminMonitoringUsers()
  if (result.status === 'error') {
    return {
      status: 'error',
      message: result.message.replace('pantauan', 'siswa'),
    }
  }

  const students: AdminStudent[] = []

  for (const user of result.users) {
    if (user.role === 'siswa' && user.is_deleted === 0) {
      students.push({
        id: user.id,
        nomor_induk: user.nomor_induk,
        nama_lengkap: user.nama_lengkap,
        kelas_id: user.kelas_id,
        kelas_nama: user.kelas_nama,
        tahun_angkatan: user.tahun_angkatan,
      })
    }
  }

  return { status: 'success', students }
}
