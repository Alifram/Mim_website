import { createClient } from '@/lib/supabase/server'

import {
  parseMonthlyPaymentReport,
  parsePaymentCategories,
  parsePaymentStudents,
  type FinancePaymentPageData,
  type FinancePaymentPageResult,
} from './payment-types'

export async function getFinancePaymentPageData(
  year: number,
  month: number,
): Promise<FinancePaymentPageResult> {
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
  const { data: categoriesData, error: categoriesError } = await supabase.rpc(
    'get_my_payment_categories',
  )

  if (categoriesError) {
    return {
      status: 'error',
      message:
        categoriesError.code === '42501'
          ? 'Kategori pembayaran hanya tersedia untuk akun petugas keuangan aktif.'
          : 'Kategori pembayaran belum dapat dimuat. Periksa koneksi lalu coba lagi.',
    }
  }

  const categories = parsePaymentCategories(categoriesData)
  if (!categories) {
    return {
      status: 'error',
      message: 'Format kategori pembayaran dari server tidak valid.',
    }
  }

  const data: FinancePaymentPageData = {
    categories,
    students: [],
    report: null,
    reportError: null,
  }

  if (categories.length === 0) return { status: 'success', data }

  const { data: studentsData, error: studentsError } = await supabase.rpc(
    'get_payment_students',
  )

  if (studentsError) {
    return {
      status: 'error',
      message:
        studentsError.code === '42501'
          ? 'Akun ini belum memiliki kategori pembayaran yang ditugaskan.'
          : 'Daftar siswa belum dapat dimuat. Periksa koneksi lalu coba lagi.',
    }
  }

  const students = parsePaymentStudents(studentsData)
  if (!students) {
    return {
      status: 'error',
      message: 'Format daftar siswa dari server tidak valid.',
    }
  }
  data.students = students

  const { data: reportData, error: reportError } = await supabase.rpc(
    'get_monthly_payment_report',
    {
      p_year: year,
      p_month: month,
      p_student_user_id: null,
    },
  )

  if (reportError) {
    data.reportError =
      reportError.code === '42501'
        ? 'Akun ini tidak berhak melihat laporan kategori pembayaran.'
        : 'Laporan pembayaran belum dapat dimuat. Periksa koneksi lalu coba lagi.'
    return { status: 'success', data }
  }

  data.report = parseMonthlyPaymentReport(reportData)
  if (
    !data.report ||
    data.report.year !== year ||
    data.report.month !== month
  ) {
    data.report = null
    data.reportError = 'Format laporan pembayaran dari server tidak valid.'
  }

  return { status: 'success', data }
}
