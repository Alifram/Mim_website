import { createClient } from '@/lib/supabase/server'

import {
  parseStudentReport,
  type StudentReportGrade,
} from './student-report-types'

export type StudentReportResult =
  | { status: 'success'; report: StudentReportGrade[] }
  | { status: 'error'; message: string }

export async function getStudentReport(): Promise<StudentReportResult> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('get_my_student_report')

  if (error) {
    return {
      status: 'error',
      message:
        error.code === '42501'
          ? 'Rapor hanya tersedia untuk siswa aktif.'
          : 'Rapor belum dapat dimuat. Periksa koneksi dan coba lagi.',
    }
  }

  const report = parseStudentReport(data)
  if (!report) {
    return {
      status: 'error',
      message: 'Format data rapor dari server tidak valid.',
    }
  }

  return { status: 'success', report }
}
