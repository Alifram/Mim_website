'use client'

import { createClient } from '@/lib/supabase/client'

import {
  parseScheduleList,
  scheduleDays,
  type ScheduleDay,
  type SchoolSchedule,
} from './schedule-types'

export type ScheduleOperationResult =
  | { status: 'success'; message: string }
  | { status: 'error'; message: string }

export type FetchScheduleResult =
  | { status: 'success'; schedules: SchoolSchedule[] }
  | { status: 'error'; message: string }

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function parseOperationResponse(value: unknown, fallback: string) {
  if (!isRecord(value) || value.status !== 'success') {
    return {
      status: 'error' as const,
      message: 'Respons layanan jadwal dari server tidak valid.',
    }
  }

  return {
    status: 'success' as const,
    message: typeof value.message === 'string' ? value.message : fallback,
  }
}

function getScheduleErrorMessage(code: string | undefined, fallback: string) {
  if (code === '42501') return 'Hanya admin aktif yang dapat mengelola jadwal.'
  if (code === '22023') {
    return 'Data kelas, penugasan, ruangan, hari, atau waktu tidak valid.'
  }
  if (code === '23P01') {
    return 'Jadwal bertabrakan dengan jadwal kelas atau jam mengajar guru lain.'
  }
  if (code === 'P0002') return 'Jadwal atau penugasan yang dipilih tidak ditemukan.'
  return fallback
}

export async function fetchAdminSchedule(
  classId: number,
  day: ScheduleDay,
): Promise<FetchScheduleResult> {
  if (!Number.isSafeInteger(classId) || classId <= 0 || !scheduleDays.includes(day)) {
    return { status: 'error', message: 'Pilih kelas dan hari yang valid.' }
  }

  try {
    const supabase = createClient()
    const { data, error } = await supabase.rpc('admin_get_schedule_data', {
      p_kelas_id: classId,
      p_hari: day,
    })

    if (error) {
      return {
        status: 'error',
        message: getScheduleErrorMessage(
          error.code,
          'Jadwal belum dapat dimuat. Periksa koneksi lalu coba lagi.',
        ),
      }
    }

    const schedules = parseScheduleList(data)
    if (!schedules) {
      return {
        status: 'error',
        message: 'Format data jadwal dari server tidak valid.',
      }
    }

    return { status: 'success', schedules }
  } catch {
    return {
      status: 'error',
      message: 'Jadwal belum dapat dimuat. Periksa koneksi lalu coba lagi.',
    }
  }
}

export async function fetchMySchedule(
  day: ScheduleDay,
): Promise<FetchScheduleResult> {
  if (!scheduleDays.includes(day)) {
    return { status: 'error', message: 'Pilih hari jadwal yang valid.' }
  }

  try {
    const supabase = createClient()
    const { data, error } = await supabase.rpc('get_my_schedule', {
      p_hari: day,
    })

    if (error) {
      if (error.code === '42501') {
        return {
          status: 'error',
          message: 'Jadwal hanya tersedia untuk akun guru atau siswa aktif.',
        }
      }
      if (error.code === '22023') {
        return {
          status: 'error',
          message: 'Hari jadwal tidak valid atau kelas akun belum diatur.',
        }
      }
      return {
        status: 'error',
        message: 'Jadwal pelajaran belum dapat dimuat. Periksa koneksi lalu coba lagi.',
      }
    }

    const schedules = parseScheduleList(data)
    if (!schedules) {
      return {
        status: 'error',
        message: 'Format data jadwal mengajar dari server tidak valid.',
      }
    }

    return { status: 'success', schedules }
  } catch {
    return {
      status: 'error',
      message: 'Jadwal pelajaran belum dapat dimuat. Periksa koneksi lalu coba lagi.',
    }
  }
}

export async function saveAdminSchedule({
  id,
  assignmentId,
  day,
  startTime,
  endTime,
  room,
}: {
  id: number | null
  assignmentId: number
  day: ScheduleDay
  startTime: string
  endTime: string
  room: string
}): Promise<ScheduleOperationResult> {
  const normalizedRoom = room.trim()
  if (
    (id !== null && (!Number.isSafeInteger(id) || id <= 0)) ||
    !Number.isSafeInteger(assignmentId) ||
    assignmentId <= 0 ||
    !scheduleDays.includes(day) ||
    !/^\d{2}:\d{2}$/.test(startTime) ||
    !/^\d{2}:\d{2}$/.test(endTime) ||
    endTime <= startTime ||
    !normalizedRoom ||
    normalizedRoom.length > 50
  ) {
    return {
      status: 'error',
      message:
        'Isi penugasan, hari, waktu mulai/selesai, dan ruangan dengan benar.',
    }
  }

  try {
    const supabase = createClient()
    const { data, error } = await supabase.rpc('admin_save_schedule', {
      p_id: id,
      p_kelas_mapel_id: assignmentId,
      p_hari: day,
      p_jam_mulai: `${startTime}:00`,
      p_jam_selesai: `${endTime}:00`,
      p_ruangan: normalizedRoom,
    })

    if (error) {
      return {
        status: 'error',
        message: getScheduleErrorMessage(
          error.code,
          'Jadwal belum berhasil disimpan. Periksa koneksi dan coba lagi.',
        ),
      }
    }

    return parseOperationResponse(data, id === null
      ? 'Jadwal berhasil disimpan.'
      : 'Jadwal berhasil diperbarui.')
  } catch {
    return {
      status: 'error',
      message: 'Jadwal belum berhasil disimpan. Periksa koneksi lalu coba lagi.',
    }
  }
}

export async function deleteAdminSchedule(
  id: number,
): Promise<ScheduleOperationResult> {
  if (!Number.isSafeInteger(id) || id <= 0) {
    return { status: 'error', message: 'ID jadwal tidak valid.' }
  }

  try {
    const supabase = createClient()
    const { data, error } = await supabase.rpc('admin_delete_schedule', {
      p_id: id,
    })

    if (error) {
      return {
        status: 'error',
        message: getScheduleErrorMessage(
          error.code,
          'Jadwal belum berhasil dihapus. Periksa koneksi lalu coba lagi.',
        ),
      }
    }

    return parseOperationResponse(data, 'Jadwal berhasil dihapus.')
  } catch {
    return {
      status: 'error',
      message: 'Jadwal belum berhasil dihapus. Periksa koneksi lalu coba lagi.',
    }
  }
}
