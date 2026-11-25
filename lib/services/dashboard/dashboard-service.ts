import { createClient } from '@/lib/supabase/server'

export type AdminDashboardSummary = {
  total_siswa: number
  total_guru: number
  total_kelas: number
  total_pengumuman: number
}

export type AdminDashboardSummaryResult =
  | { status: 'success'; data: AdminDashboardSummary }
  | { status: 'error'; message: string }

function isCount(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0
}

export async function getAdminDashboardSummary(): Promise<AdminDashboardSummaryResult> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('get_admin_dashboard_summary')

  if (error) {
    return {
      status: 'error',
      message: 'Ringkasan belum dapat dimuat. Periksa akses dashboard lalu coba lagi.',
    }
  }
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return {
      status: 'error',
      message: 'Format ringkasan dashboard dari server tidak valid.',
    }
  }

  const summary = data as Record<string, unknown>
  const {
    total_siswa: totalSiswa,
    total_guru: totalGuru,
    total_kelas: totalKelas,
    total_pengumuman: totalPengumuman,
  } = summary

  if (
    !isCount(totalSiswa) ||
    !isCount(totalGuru) ||
    !isCount(totalKelas) ||
    !isCount(totalPengumuman)
  ) {
    return {
      status: 'error',
      message: 'Data ringkasan dashboard belum lengkap atau tidak valid.',
    }
  }

  return {
    status: 'success',
    data: {
      total_siswa: totalSiswa,
      total_guru: totalGuru,
      total_kelas: totalKelas,
      total_pengumuman: totalPengumuman,
    },
  }
}
