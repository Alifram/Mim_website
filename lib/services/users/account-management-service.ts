import { createClient } from '@/lib/supabase/server'

export type ManagedAccount = {
  id: number
  nomor_induk: string
  nama_lengkap: string
  email: string
  role: 'admin' | 'guru' | 'siswa' | 'orang_tua' | 'petugas_keuangan'
  jenis_guru: string | null
  kelas_id: number | null
  kelas_nama: string | null
  tahun_angkatan: number | null
  is_deleted: number
}

export type AccountManagementClass = {
  id: number
  nama: string
}

export type AccountManagementData = {
  accounts: ManagedAccount[]
  classes: AccountManagementClass[]
  paymentCategories: { code: string; name: string }[]
}

export type AccountManagementResult =
  | { status: 'success'; data: AccountManagementData }
  | { status: 'error'; message: string }

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function parseInteger(value: unknown): number | null {
  if (typeof value === 'number' && Number.isSafeInteger(value)) return value
  if (typeof value === 'string' && /^-?\d+$/.test(value)) {
    const parsed = Number(value)
    if (Number.isSafeInteger(parsed)) return parsed
  }
  return null
}

const roles = new Set<ManagedAccount['role']>([
  'admin',
  'guru',
  'siswa',
  'orang_tua',
  'petugas_keuangan',
])

function parseAccounts(value: unknown): ManagedAccount[] | null {
  if (!isRecord(value) || value.status !== 'success' || !Array.isArray(value.data)) {
    return null
  }

  const accounts: ManagedAccount[] = []
  for (const row of value.data) {
    if (!isRecord(row)) return null
    const id = parseInteger(row.id)
    const classId = row.kelas_id === null ? null : parseInteger(row.kelas_id)
    const className =
      row.kelas_nama === null
        ? null
        : typeof row.kelas_nama === 'string'
          ? row.kelas_nama
          : undefined
    const admissionYear =
      row.tahun_angkatan === null
        ? null
        : parseInteger(row.tahun_angkatan)
    const deletedStatus = parseInteger(row.is_deleted)
    const teacherType =
      row.jenis_guru === null
        ? null
        : typeof row.jenis_guru === 'string'
          ? row.jenis_guru
          : undefined

    if (
      id === null ||
      typeof row.nomor_induk !== 'string' ||
      typeof row.nama_lengkap !== 'string' ||
      typeof row.email !== 'string' ||
      typeof row.role !== 'string' ||
      !roles.has(row.role as ManagedAccount['role']) ||
      classId === undefined ||
      className === undefined ||
      admissionYear === undefined ||
      deletedStatus === null ||
      (deletedStatus !== 0 && deletedStatus !== 1) ||
      teacherType === undefined
    ) {
      return null
    }

    accounts.push({
      id,
      nomor_induk: row.nomor_induk,
      nama_lengkap: row.nama_lengkap,
      email: row.email,
      role: row.role as ManagedAccount['role'],
      jenis_guru: teacherType,
      kelas_id: classId,
      kelas_nama: className,
      tahun_angkatan: admissionYear,
      is_deleted: deletedStatus,
    })
  }
  return accounts
}

export async function getAccountManagementData(): Promise<AccountManagementResult> {
  const supabase = await createClient()
  const [accountsResult, classesResult] = await Promise.all([
    supabase.rpc('get_admin_users'),
    supabase.from('kelas').select('id, nama').eq('aktif', true).order('nama'),
  ])

  if (accountsResult.error) {
    return {
      status: 'error',
      message:
        accountsResult.error.code === '42501'
          ? 'Daftar akun hanya dapat diakses oleh admin aktif.'
          : 'Daftar akun belum dapat dimuat. Periksa koneksi lalu coba lagi.',
    }
  }
  if (classesResult.error) {
    return {
      status: 'error',
      message: 'Daftar kelas belum dapat dimuat untuk pengelolaan akun.',
    }
  }

  const accounts = parseAccounts(accountsResult.data)
  if (!accounts) {
    return {
      status: 'error',
      message: 'Format daftar akun dari server tidak valid.',
    }
  }

  const classes: AccountManagementClass[] = []
  for (const row of classesResult.data ?? []) {
    if (
      !isRecord(row) ||
      typeof row.id !== 'number' ||
      !Number.isSafeInteger(row.id) ||
      typeof row.nama !== 'string'
    ) {
      return {
        status: 'error',
        message: 'Format daftar kelas dari server tidak valid.',
      }
    }
    classes.push({ id: row.id, nama: row.nama })
  }

  const { data: categoryData, error: categoryError } = await supabase.rpc(
    'get_my_payment_categories',
  )
  if (categoryError) {
    return {
      status: 'error',
      message: 'Daftar kategori pembayaran belum dapat dimuat.',
    }
  }
  if (
    !isRecord(categoryData) ||
    categoryData.status !== 'success' ||
    !Array.isArray(categoryData.data)
  ) {
    return {
      status: 'error',
      message: 'Format kategori pembayaran dari server tidak valid.',
    }
  }

  const paymentCategories: { code: string; name: string }[] = []
  for (const row of categoryData.data) {
    if (
      !isRecord(row) ||
      typeof row.code !== 'string' ||
      typeof row.name !== 'string'
    ) {
      return {
        status: 'error',
        message: 'Format kategori pembayaran dari server tidak valid.',
      }
    }
    paymentCategories.push({ code: row.code, name: row.name })
  }

  return {
    status: 'success',
    data: { accounts, classes, paymentCategories },
  }
}
