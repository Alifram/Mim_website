import { createClient } from '@/lib/supabase/server'

import {
  parseScheduleList,
  scheduleDays,
  type ScheduleDay,
  type SchoolSchedule,
} from './schedule-types'

export type ScheduleResult =
  | { status: 'success'; schedules: SchoolSchedule[] }
  | { status: 'error'; message: string }

export async function getMySchedule(
  day: ScheduleDay,
): Promise<ScheduleResult> {
  if (!scheduleDays.includes(day)) {
    return { status: 'error', message: 'Pilih hari jadwal yang valid.' }
  }

  const supabase = await createClient()
  const { data, error } = await supabase.rpc('get_my_schedule', {
    p_hari: day,
  })

  if (error) {
    return {
      status: 'error',
      message:
        'Jadwal pelajaran belum dapat dimuat. Pastikan akun aktif dan penugasan kelas tersedia.',
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
}

export async function getAdminSchedule(
  classId: number,
  day: ScheduleDay,
): Promise<ScheduleResult> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('admin_get_schedule_data', {
    p_kelas_id: classId,
    p_hari: day,
  })

  if (error) {
    return {
      status: 'error',
      message:
        'Jadwal belum dapat dimuat. Pastikan RPC Supabase tersedia dan kelas masih aktif.',
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
}
