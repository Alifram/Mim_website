'use client'

import { createClient } from '@/lib/supabase/client'

import {
  parseMonthlyPaymentReport,
  type MonthlyPaymentReport,
} from './payment-types'

export type FinancePaymentReportResult =
  | { status: 'success'; report: MonthlyPaymentReport }
  | { status: 'error'; message: string }

export type RecordPaymentResult =
  | { status: 'success'; message: string }
  | { status: 'error'; message: string }

export async function fetchFinancePaymentReport(
  year: number,
  month: number,
  studentId: number | null,
): Promise<FinancePaymentReportResult> {
  if (
    !Number.isSafeInteger(year) ||
    year < 2000 ||
    year > 2200 ||
    !Number.isSafeInteger(month) ||
    month < 1 ||
    month > 12 ||
    (studentId !== null &&
      (!Number.isSafeInteger(studentId) || studentId <= 0))
  ) {
    return { status: 'error', message: 'Periode atau siswa laporan tidak valid.' }
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
            ? 'Akun ini tidak berhak melihat laporan kategori pembayaran.'
            : error.code === '22023'
              ? 'Periode laporan yang dipilih tidak valid.'
              : 'Laporan pembayaran belum dapat dimuat. Periksa koneksi lalu coba lagi.',
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
      message: 'Laporan pembayaran belum dapat dimuat. Periksa koneksi lalu coba lagi.',
    }
  }
}

export async function recordPaymentTransaction(
  studentId: number,
  categoryCode: string,
  amount: string,
  paidAt: string,
  note: string,
): Promise<RecordPaymentResult> {
  const normalizedAmount = amount.trim()
  const normalizedNote = note.trim()
  const amountValue = Number(normalizedAmount)
  const validDate =
    /^\d{4}-\d{2}-\d{2}$/.test(paidAt) &&
    !Number.isNaN(Date.parse(`${paidAt}T00:00:00Z`)) &&
    new Date(`${paidAt}T00:00:00Z`).toISOString().slice(0, 10) === paidAt

  if (
    !Number.isSafeInteger(studentId) ||
    studentId <= 0 ||
    !categoryCode.trim() ||
    !/^\d{1,12}(?:\.\d{1,2})?$/.test(normalizedAmount) ||
    !Number.isFinite(amountValue) ||
    amountValue <= 0 ||
    amountValue > 999999999999.99 ||
    !validDate ||
    normalizedNote.length > 500
  ) {
    return {
      status: 'error',
      message: 'Lengkapi data pembayaran dengan nilai yang valid.',
    }
  }

  try {
    const supabase = createClient()
    const { data, error } = await supabase.rpc('record_payment_transaction', {
      p_student_user_id: studentId,
      p_category_code: categoryCode,
      p_amount: normalizedAmount,
      p_paid_at: paidAt,
      p_note: normalizedNote || null,
    })

    if (error) {
      return {
        status: 'error',
        message:
          error.code === '42501'
            ? 'Akun ini tidak berhak mencatat kategori pembayaran tersebut.'
            : error.code === '22023'
              ? 'Data pembayaran tidak valid. Periksa jumlah, tanggal, dan siswa.'
              : 'Pembayaran belum berhasil dicatat. Periksa koneksi lalu coba lagi.',
      }
    }

    if (
      typeof data !== 'object' ||
      data === null ||
      Array.isArray(data) ||
      !('status' in data) ||
      data.status !== 'success' ||
      !('transaction_id' in data) ||
      !(
        (typeof data.transaction_id === 'number' &&
          Number.isSafeInteger(data.transaction_id) &&
          data.transaction_id > 0) ||
        (typeof data.transaction_id === 'string' &&
          /^[1-9]\d*$/.test(data.transaction_id))
      )
    ) {
      return {
        status: 'error',
        message: 'Server tidak mengonfirmasi penyimpanan transaksi.',
      }
    }

    return { status: 'success', message: 'Pembayaran berhasil dicatat.' }
  } catch {
    return {
      status: 'error',
      message: 'Pembayaran belum berhasil dicatat. Periksa koneksi lalu coba lagi.',
    }
  }
}
