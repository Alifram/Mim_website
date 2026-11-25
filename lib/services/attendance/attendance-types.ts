export const attendanceStatuses = ['Hadir', 'Sakit', 'Izin', 'Alpa'] as const

export type AttendanceStatus = (typeof attendanceStatuses)[number]

export type AttendanceClass = {
  id: number
  nama: string
}

export type AttendanceStudent = {
  id: number
  nomor_induk: string | null
  nama_lengkap: string
}

export type AttendanceRecord = {
  sesi_id: number
  tanggal: string
  kelas_id: number
  kelas: string
  guru_id: number
  nama_guru: string
  siswa_id: number
  nomor_induk: string
  nama_siswa: string
  status: AttendanceStatus
  catatan: string | null
}

export type AttendanceHistory = {
  records: AttendanceRecord[]
  hasMore: boolean
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value)
}

function isAttendanceStatus(value: unknown): value is AttendanceStatus {
  return typeof value === 'string' &&
    attendanceStatuses.includes(value as AttendanceStatus)
}

export function parseAttendanceClasses(value: unknown): AttendanceClass[] | null {
  if (!Array.isArray(value)) return null

  const classes: AttendanceClass[] = []
  for (const row of value) {
    if (
      !isRecord(row) ||
      !isInteger(row.id) ||
      typeof row.nama !== 'string'
    ) {
      return null
    }
    classes.push({ id: row.id, nama: row.nama })
  }
  return classes
}

export function parseAttendanceStudents(
  value: unknown,
): AttendanceStudent[] | null {
  if (
    !isRecord(value) ||
    value.status !== 'success' ||
    !Array.isArray(value.data)
  ) {
    return null
  }

  const students: AttendanceStudent[] = []
  for (const row of value.data) {
    if (
      !isRecord(row) ||
      !isInteger(row.id) ||
      row.id <= 0 ||
      typeof row.nama_lengkap !== 'string' ||
      (row.nomor_induk !== null && typeof row.nomor_induk !== 'string')
    ) {
      return null
    }

    students.push({
      id: row.id,
      nama_lengkap: row.nama_lengkap,
      nomor_induk: row.nomor_induk,
    })
  }

  return students
}

export function parseAttendanceHistory(value: unknown): AttendanceHistory | null {
  if (
    !isRecord(value) ||
    value.status !== 'success' ||
    typeof value.has_more !== 'boolean' ||
    !Array.isArray(value.data)
  ) {
    return null
  }

  const records: AttendanceRecord[] = []
  for (const row of value.data) {
    if (
      !isRecord(row) ||
      !isInteger(row.sesi_id) ||
      typeof row.tanggal !== 'string' ||
      !isInteger(row.kelas_id) ||
      typeof row.kelas !== 'string' ||
      !isInteger(row.guru_id) ||
      typeof row.nama_guru !== 'string' ||
      !isInteger(row.siswa_id) ||
      typeof row.nomor_induk !== 'string' ||
      typeof row.nama_siswa !== 'string' ||
      !isAttendanceStatus(row.status) ||
      (row.catatan !== null && typeof row.catatan !== 'string')
    ) {
      return null
    }

    records.push({
      sesi_id: row.sesi_id,
      tanggal: row.tanggal,
      kelas_id: row.kelas_id,
      kelas: row.kelas,
      guru_id: row.guru_id,
      nama_guru: row.nama_guru,
      siswa_id: row.siswa_id,
      nomor_induk: row.nomor_induk,
      nama_siswa: row.nama_siswa,
      status: row.status,
      catatan: row.catatan,
    })
  }

  return { records, hasMore: value.has_more }
}
