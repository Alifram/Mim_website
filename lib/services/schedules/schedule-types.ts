export const scheduleDays = [
  'Senin',
  'Selasa',
  'Rabu',
  'Kamis',
  'Jumat',
  'Sabtu',
] as const

export type ScheduleDay = (typeof scheduleDays)[number]

export type SchoolSchedule = {
  id: number
  kelas_id: number
  kelas: string
  hari: ScheduleDay
  jam_mulai: string
  jam_selesai: string
  jam_mulai_format: string
  jam_selesai_format: string
  mata_pelajaran: string
  guru_pengampu: string
  ruangan: string | null
  kelas_mapel_id: number
  tahun_ajaran: string
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value)
}

function isScheduleDay(value: unknown): value is ScheduleDay {
  return typeof value === 'string' &&
    scheduleDays.includes(value as ScheduleDay)
}

function isTime(value: unknown): value is string {
  return typeof value === 'string' && /^\d{2}:\d{2}(?::\d{2})?$/.test(value)
}

export function parseScheduleList(value: unknown): SchoolSchedule[] | null {
  if (!Array.isArray(value)) return null

  const schedules: SchoolSchedule[] = []

  for (const row of value) {
    if (
      !isRecord(row) ||
      !isInteger(row.id) ||
      !isInteger(row.kelas_id) ||
      typeof row.kelas !== 'string' ||
      !isScheduleDay(row.hari) ||
      !isTime(row.jam_mulai) ||
      !isTime(row.jam_selesai) ||
      typeof row.jam_mulai_format !== 'string' ||
      typeof row.jam_selesai_format !== 'string' ||
      typeof row.mata_pelajaran !== 'string' ||
      typeof row.guru_pengampu !== 'string' ||
      (row.ruangan !== null && typeof row.ruangan !== 'string') ||
      !isInteger(row.kelas_mapel_id) ||
      typeof row.tahun_ajaran !== 'string'
    ) {
      return null
    }

    schedules.push({
      id: row.id,
      kelas_id: row.kelas_id,
      kelas: row.kelas,
      hari: row.hari,
      jam_mulai: row.jam_mulai,
      jam_selesai: row.jam_selesai,
      jam_mulai_format: row.jam_mulai_format,
      jam_selesai_format: row.jam_selesai_format,
      mata_pelajaran: row.mata_pelajaran,
      guru_pengampu: row.guru_pengampu,
      ruangan: row.ruangan,
      kelas_mapel_id: row.kelas_mapel_id,
      tahun_ajaran: row.tahun_ajaran,
    })
  }

  return schedules
}
