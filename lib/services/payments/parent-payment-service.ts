import { createClient } from '@/lib/supabase/server'

import {
  parseMonthlyPaymentReport,
  parseParentLinkedStudents,
  type ParentPaymentPageData,
  type ParentPaymentPageResult,
} from './payment-types'

export async function getParentPaymentPageData(
  year: number,
  month: number,
): Promise<ParentPaymentPageResult> {
  if (
    !Number.isSafeInteger(year) ||
    year < 2000 ||
    year > 2200 ||
    !Number.isSafeInteger(month) ||
    month < 1 ||
    month > 12
  ) {
    return { status: 'error', message: 'Periode laporan pembayaran tidak valid.' }
  }

  const supabase = await createClient()
  const { data: linkedStudentsData, error: linkedStudentsError } =
    await supabase.rpc('get_my_linked_students')

  if (linkedStudentsError) {
    return {
      status: 'error',
      message:
        linkedStudentsError.code === '42501'
          ? 'Data anak hanya tersedia untuk akun orang tua aktif.'
          : 'Data anak belum dapat dimuat. Periksa koneksi lalu coba lagi.',
    }
  }

  const students = parseParentLinkedStudents(linkedStudentsData)
  if (!students) {
    return {
      status: 'error',
      message: 'Format daftar anak dari server tidak valid.',
    }
  }

  const selectedStudentId = students[0]?.id ?? null
  const data: ParentPaymentPageData = {
    students,
    selectedStudentId,
    report: null,
    reportError: null,
  }

  if (selectedStudentId === null) return { status: 'success', data }

  const { data: reportData, error: reportError } = await supabase.rpc(
    'get_monthly_payment_report',
    {
      p_year: year,
      p_month: month,
      p_student_user_id: selectedStudentId,
    },
  )

  if (reportError) {
    data.reportError =
      reportError.code === '42501'
        ? 'Akun ini tidak berhak melihat transaksi anak yang dipilih.'
        : 'Laporan Infaq & Wakaf belum dapat dimuat. Coba pilih periode lain.'
    return { status: 'success', data }
  }

  data.report = parseMonthlyPaymentReport(reportData)
  if (!data.report) {
    data.reportError = 'Format laporan pembayaran dari server tidak valid.'
  }

  return { status: 'success', data }
}
