import { isRecord } from '@/lib/services/grades/teacher-grade-types'

export type SchoolEventClass = {
  id: number
  nama: string
}

export type SchoolEvent = {
  id: number
  judul_acara: string
  deskripsi: string
  target_semua_kelas: boolean
  target_kelas_ids: number[]
  target_kelas: string
  gambar_url: string | null
  gambar_signed_url: string | null
  tanggal_acara: string
  dibuat_oleh: string
  created_at: string
}

export type SchoolEventComment = {
  id: number
  event_id: number
  nama_pengirim: string
  role_pengirim: string
  isi_komentar: string
  created_at: string
}

function parseInteger(value: unknown): number | null {
  if (typeof value === 'number' && Number.isSafeInteger(value)) return value
  if (typeof value === 'string' && /^\d+$/.test(value)) {
    const parsed = Number(value)
    if (Number.isSafeInteger(parsed)) return parsed
  }
  return null
}

export function parseSchoolEventClasses(value: unknown): SchoolEventClass[] | null {
  if (!Array.isArray(value)) return null

  const classes: SchoolEventClass[] = []
  for (const row of value) {
    if (
      !isRecord(row) ||
      parseInteger(row.id) === null ||
      parseInteger(row.id)! <= 0 ||
      typeof row.nama !== 'string' ||
      !row.nama.trim()
    ) {
      return null
    }

    classes.push({ id: parseInteger(row.id)!, nama: row.nama })
  }
  return classes
}

export function parseSchoolEvents(value: unknown): SchoolEvent[] | null {
  if (!isRecord(value) || value.status !== 'success' || !Array.isArray(value.data)) {
    return null
  }

  const events: SchoolEvent[] = []
  for (const row of value.data) {
    if (
      !isRecord(row) ||
      parseInteger(row.id) === null ||
      parseInteger(row.id)! <= 0 ||
      typeof row.judul_acara !== 'string' ||
      typeof row.deskripsi !== 'string' ||
      typeof row.target_semua_kelas !== 'boolean' ||
      !Array.isArray(row.target_kelas_ids) ||
      !row.target_kelas_ids.every(
        (id) => parseInteger(id) !== null && parseInteger(id)! > 0,
      ) ||
      typeof row.target_kelas !== 'string' ||
      (row.gambar_url !== null && typeof row.gambar_url !== 'string') ||
      typeof row.tanggal_acara !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}$/.test(row.tanggal_acara) ||
      typeof row.dibuat_oleh !== 'string' ||
      typeof row.created_at !== 'string'
    ) {
      return null
    }

    events.push({
      id: parseInteger(row.id)!,
      judul_acara: row.judul_acara,
      deskripsi: row.deskripsi,
      target_semua_kelas: row.target_semua_kelas,
      target_kelas_ids: row.target_kelas_ids.map((id) => parseInteger(id)!),
      target_kelas: row.target_kelas,
      gambar_url: row.gambar_url,
      gambar_signed_url: null,
      tanggal_acara: row.tanggal_acara,
      dibuat_oleh: row.dibuat_oleh,
      created_at: row.created_at,
    })
  }

  return events
}

export function parseSchoolEventComments(value: unknown): SchoolEventComment[] | null {
  if (!isRecord(value) || value.status !== 'success' || !Array.isArray(value.data)) {
    return null
  }

  const comments: SchoolEventComment[] = []
  for (const row of value.data) {
    if (
      !isRecord(row) ||
      parseInteger(row.id) === null ||
      parseInteger(row.event_id) === null ||
      typeof row.nama_pengirim !== 'string' ||
      typeof row.role_pengirim !== 'string' ||
      typeof row.isi_komentar !== 'string' ||
      typeof row.created_at !== 'string'
    ) {
      return null
    }

    comments.push({
      id: parseInteger(row.id)!,
      event_id: parseInteger(row.event_id)!,
      nama_pengirim: row.nama_pengirim,
      role_pengirim: row.role_pengirim,
      isi_komentar: row.isi_komentar,
      created_at: row.created_at,
    })
  }
  return comments
}
