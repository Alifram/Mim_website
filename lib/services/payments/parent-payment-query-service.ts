'use client'

import { createClient } from '@/lib/supabase/client'

import { parseMonthlyPaymentReport, type MonthlyPaymentReport } from './payment-types'

export type ParentPaymentReportResult =
  | { status: 'success'; report: MonthlyPaymentReport }
  | { status: 'error'; message: string }

export async function fetchParentPaymentReport(
  year: number,
  month: number,
  studentId: number,
): Promise<ParentPaymentReportResult> {
  if (
    !Number.isSafeInteger(year) ||
    year < 2000 ||
    year > 2200 ||
    !Number.isSafeInteger(month) ||
    month < 1 ||
    month > 12 ||
    !Number.isSafeInteger(studentId) ||
    studentId <= 0
  ) {
    return {
      status: 'error',
      message: 'Pilih anak dan periode laporan yang valid.',
    }
  }

  try {
    const supabase = createClient()
    const { data, error } = await supabase.rpc('get_monthly_payment_report', {
      p_year: year,
      p_month: month,
      p_student_user_id: studentId,
    })

    if (error) {
      return {
        status: 'error',
        message:
          error.code === '42501'
            ? 'Akun ini tidak berhak melihat transaksi anak yang dipilih.'
            : error.code === '22023'
              ? 'Periode laporan yang dipilih tidak valid.'
              : 'Laporan Infaq & Wakaf belum dapat dimuat. Periksa koneksi lalu coba lagi.',
      }
    }

    const report = parseMonthlyPaymentReport(data)
    if (!report || report.year !== year || report.month !== month) {
      return {
        status: 'error',
        message: 'Format laporan pembayaran dari server tidak valid.',
      }
    }

    return { status: 'success', report }
  } catch {
    return {
      status: 'error',
      message: 'Laporan Infaq & Wakaf belum dapat dimuat. Periksa koneksi lalu coba lagi.',
    }
  }
}
