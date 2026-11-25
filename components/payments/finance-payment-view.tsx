'use client'

import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import {
  Banknote,
  CalendarDays,
  CreditCard,
  ReceiptText,
  UsersRound,
} from 'lucide-react'

import {
  fetchFinancePaymentReport,
  recordPaymentTransaction,
} from '@/lib/services/payments/finance-payment-query-service'
import type {
  MonthlyPaymentReport,
  PaymentCategory,
  PaymentStudent,
} from '@/lib/services/payments/payment-types'

type FinancePaymentViewProps = {
  categories: PaymentCategory[]
  initialMonth: string
  initialReport: MonthlyPaymentReport | null
  initialReportError: string | null
  initialStudentId: number | null
  initialDate: string
  students: PaymentStudent[]
  staffName: string
}

type Feedback = {
  status: 'success' | 'error'
  message: string
}

const fieldClassName =
  'min-h-11 w-full rounded-xl border border-[#dce5df] bg-white px-3.5 text-sm text-[#26382e] outline-none transition focus:border-[#0f5132] focus:ring-2 focus:ring-[#0f5132]/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-[#616161] dark:bg-[#111b21] dark:text-[#e8e5de] dark:focus:border-[#ffd166] dark:focus:ring-[#ffd166]/10'

const labelClassName =
  'mb-1.5 block text-xs font-semibold text-[#35463b] dark:text-[#e8e5de]'

function formatCurrency(amount: number) {
  const minimumFractionDigits = amount % 1 === 0 ? 0 : 2
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits,
    maximumFractionDigits: 2,
  }).format(amount)
}

function formatPeriod(value: string) {
  return new Intl.DateTimeFormat('id-ID', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${value}-01T00:00:00Z`))
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeZone: 'Asia/Jakarta',
  }).format(new Date(`${value}T00:00:00+07:00`))
}

function parsePeriod(value: string) {
  const match = /^(\d{4})-(\d{2})$/.exec(value)
  if (!match) return null

  const year = Number(match[1])
  const month = Number(match[2])
  return year >= 2000 && month >= 1 && month <= 12
    ? { year, month }
    : null
}

export default function FinancePaymentView({
  categories,
  initialMonth,
  initialReport,
  initialReportError,
  initialStudentId,
  initialDate,
  students,
  staffName,
}: FinancePaymentViewProps) {
  const requestId = useRef(0)
  const submitLock = useRef(false)
  const [paymentStudentId, setPaymentStudentId] = useState(
    initialStudentId ? String(initialStudentId) : '',
  )
  const [categoryCode, setCategoryCode] = useState(categories[0]?.code ?? '')
  const [amount, setAmount] = useState('')
  const [paidAt, setPaidAt] = useState(initialDate)
  const [note, setNote] = useState('')
  const [selectedMonth, setSelectedMonth] = useState(initialMonth)
  const [reportStudentId, setReportStudentId] = useState('all')
  const [report, setReport] = useState(initialReport)
  const [reportError, setReportError] = useState(initialReportError)
  const [isLoadingReport, setIsLoadingReport] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [feedback, setFeedback] = useState<Feedback | null>(null)

  const transactionCount = useMemo(
    () =>
      report?.totals.reduce(
        (total, category) => total + category.transaction_count,
        0,
      ) ?? 0,
    [report],
  )
  const formDisabled =
    isSubmitting || categories.length === 0 || students.length === 0

  useEffect(
    () => () => {
      requestId.current += 1
    },
    [],
  )

  async function loadReport(
    periodValue: string,
    selectedStudent: string,
  ) {
    const period = parsePeriod(periodValue)
    const studentId =
      selectedStudent === 'all' ? null : Number(selectedStudent)

    if (
      !period ||
      (studentId !== null &&
        (!Number.isSafeInteger(studentId) ||
          !students.some((student) => student.id === studentId)))
    ) {
      setReport(null)
      setReportError('Pilih periode dan siswa laporan yang valid.')
      return
    }

    const request = ++requestId.current
    setIsLoadingReport(true)
    setReport(null)
    setReportError(null)

    const result = await fetchFinancePaymentReport(
      period.year,
      period.month,
      studentId,
    )
    if (request !== requestId.current) return

    if (result.status === 'success') {
      setReport(result.report)
      setReportError(null)
    } else {
      setReportError(result.message)
    }
    setIsLoadingReport(false)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitLock.current) return

    submitLock.current = true
    setIsSubmitting(true)
    setFeedback(null)

    try {
      const result = await recordPaymentTransaction(
        Number(paymentStudentId),
        categoryCode,
        amount,
        paidAt,
        note,
      )
      setFeedback(result)

      if (result.status === 'success') {
        const month = paidAt.slice(0, 7)
        setAmount('')
        setNote('')
        setSelectedMonth(month)
        setReportStudentId('all')
        await loadReport(month, 'all')
      }
    } finally {
      submitLock.current = false
      setIsSubmitting(false)
    }
  }

  function handleMonthChange(value: string) {
    if (!parsePeriod(value)) return
    setSelectedMonth(value)
    void loadReport(value, reportStudentId)
  }

  function handleReportStudentChange(value: string) {
    if (
      value !== 'all' &&
      !students.some((student) => String(student.id) === value)
    ) {
      return
    }

    setReportStudentId(value)
    void loadReport(selectedMonth, value)
  }

  return (
    <div className="space-y-5">
      <section className="rounded-2xl bg-gradient-to-br from-[#0f5132] to-[#24734b] p-5 text-white shadow-sm sm:p-6">
        <div className="flex items-start gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-white/15">
            <CreditCard aria-hidden="true" size={22} />
          </span>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-white/70">
              Keuangan Sekolah
            </p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight">
              Pembayaran
            </h2>
            <p className="mt-2 text-sm text-white/85">
              Halo, {staffName}. Catat pembayaran sesuai kategori tugas Anda.
            </p>
          </div>
        </div>
      </section>

      {categories.length === 0 ? (
        <section
          className="rounded-2xl border border-dashed border-[#dce5df] bg-white px-5 py-10 text-center dark:border-[#616161] dark:bg-[#1c2d35]"
          role="status"
        >
          <CreditCard
            aria-hidden="true"
            className="mx-auto text-[#8a9990] dark:text-[#d8d5cd]"
            size={32}
          />
          <h3 className="mt-3 text-base font-semibold text-[#26382e] dark:text-[#e8e5de]">
            Belum ada kategori pembayaran
          </h3>
          <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-[#718078] dark:text-[#c5c2ba]">
            Minta admin sekolah menugaskan kategori pembayaran ke akun Anda
            sebelum mencatat transaksi.
          </p>
        </section>
      ) : (
        <>
          <section className="grid gap-5 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
            <form
              className="h-fit rounded-2xl border border-[#e5ebe7] bg-white p-5 shadow-sm dark:border-[#616161] dark:bg-[#1c2d35] sm:p-6"
              onSubmit={handleSubmit}
            >
              <div className="mb-5 flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-[#eaf3ed] text-[#0f5132] dark:bg-[#34434b] dark:text-[#ffd166]">
                  <Banknote aria-hidden="true" size={19} />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-[#26382e] dark:text-[#e8e5de]">
                    Catat pembayaran
                  </h3>
                  <p className="mt-0.5 text-xs text-[#718078] dark:text-[#c5c2ba]">
                    Transaksi akan tersimpan di riwayat pembayaran siswa.
                  </p>
                </div>
              </div>

              <label className={labelClassName} htmlFor="payment-student">
                Siswa
              </label>
              <select
                className={fieldClassName}
                disabled={formDisabled}
                id="payment-student"
                onChange={(event) => setPaymentStudentId(event.target.value)}
                required
                value={paymentStudentId}
              >
                <option value="">Pilih siswa</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.nama_lengkap}
                    {student.kelas_nama ? ` — ${student.kelas_nama}` : ''}
                  </option>
                ))}
              </select>

              <label
                className={`${labelClassName} mt-4`}
                htmlFor="payment-category"
              >
                Jenis pembayaran
              </label>
              <select
                className={fieldClassName}
                disabled={formDisabled}
                id="payment-category"
                onChange={(event) => setCategoryCode(event.target.value)}
                required
                value={categoryCode}
              >
                {categories.map((category) => (
                  <option key={category.code} value={category.code}>
                    {category.name}
                  </option>
                ))}
              </select>

              <label className={`${labelClassName} mt-4`} htmlFor="payment-amount">
                Jumlah (Rp)
              </label>
              <input
                className={fieldClassName}
                disabled={formDisabled}
                id="payment-amount"
                max="999999999999.99"
                min="0.01"
                onChange={(event) => setAmount(event.target.value)}
                placeholder="Contoh: 50000"
                required
                step="0.01"
                type="number"
                value={amount}
              />

              <label className={`${labelClassName} mt-4`} htmlFor="payment-date">
                Tanggal pembayaran
              </label>
              <input
                className={fieldClassName}
                disabled={formDisabled}
                id="payment-date"
                onChange={(event) => setPaidAt(event.target.value)}
                required
                type="date"
                value={paidAt}
              />

              <label className={`${labelClassName} mt-4`} htmlFor="payment-note">
                Catatan <span className="font-normal text-[#718078]">(opsional)</span>
              </label>
              <textarea
                className={`${fieldClassName} min-h-24 py-3`}
                disabled={formDisabled}
                id="payment-note"
                maxLength={500}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Tambahkan keterangan jika diperlukan"
                value={note}
              />

              {feedback ? (
                <p
                  className={`mt-4 rounded-xl border px-3.5 py-3 text-xs leading-5 ${
                    feedback.status === 'success'
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-[#286345] dark:bg-[#183b2c] dark:text-[#b9f4d0]'
                      : 'border-[#f1c7c7] bg-[#fff6f6] text-[#9c2c2c] dark:border-[#713c3c] dark:bg-[#351d22] dark:text-[#ffc5c5]'
                  }`}
                  role={feedback.status === 'error' ? 'alert' : 'status'}
                >
                  {feedback.message}
                </p>
              ) : null}

              <button
                className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#0f5132] px-4 text-sm font-bold text-white transition hover:bg-[#0b4229] disabled:cursor-wait disabled:opacity-60 dark:bg-[#ffd166] dark:text-[#172027] dark:hover:bg-[#ffdc85]"
                disabled={formDisabled}
                type="submit"
              >
                <ReceiptText aria-hidden="true" size={17} />
                {isSubmitting ? 'Menyimpan…' : 'Simpan pembayaran'}
              </button>
              {students.length === 0 ? (
                <p className="mt-3 text-xs leading-5 text-amber-800 dark:text-[#ffe0a3]">
                  Belum ada siswa aktif untuk dipilih.
                </p>
              ) : null}
            </form>

            <section className="space-y-5">
              <div className="rounded-2xl border border-[#e5ebe7] bg-white p-4 shadow-sm dark:border-[#616161] dark:bg-[#1c2d35] sm:p-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label>
                    <span className={labelClassName}>Bulan laporan</span>
                    <span className="relative block">
                      <CalendarDays
                        aria-hidden="true"
                        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#718078] dark:text-[#c5c2ba]"
                        size={17}
                      />
                      <input
                        className={`${fieldClassName} pl-10`}
                        max={initialMonth}
                        min="2000-01"
                        onChange={(event) =>
                          handleMonthChange(event.target.value)
                        }
                        type="month"
                        value={selectedMonth}
                      />
                    </span>
                  </label>
                  <label>
                    <span className={labelClassName}>Filter siswa</span>
                    <span className="relative block">
                      <UsersRound
                        aria-hidden="true"
                        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#718078] dark:text-[#c5c2ba]"
                        size={17}
                      />
                      <select
                        className={`${fieldClassName} pl-10`}
                        onChange={(event) =>
                          handleReportStudentChange(event.target.value)
                        }
                        value={reportStudentId}
                      >
                        <option value="all">Semua siswa</option>
                        {students.map((student) => (
                          <option key={student.id} value={student.id}>
                            {student.nama_lengkap}
                          </option>
                        ))}
                      </select>
                    </span>
                  </label>
                </div>
              </div>

              {reportError ? (
                <p
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200"
                  role="alert"
                >
                  {reportError}
                </p>
              ) : null}

              {isLoadingReport ? (
                <div
                  aria-busy="true"
                  className="rounded-2xl border border-[#e5ebe7] bg-white px-5 py-12 text-center text-sm text-[#718078] dark:border-[#616161] dark:bg-[#1c2d35] dark:text-[#c5c2ba]"
                  role="status"
                >
                  Memuat laporan…
                </div>
              ) : report ? (
                <>
                  <section
                    aria-label="Ringkasan pembayaran"
                    className="grid gap-3 sm:grid-cols-2"
                  >
                    <article className="rounded-2xl border border-[#e5ebe7] bg-white p-5 shadow-sm dark:border-[#616161] dark:bg-[#1c2d35]">
                      <p className="text-xs font-medium text-[#718078] dark:text-[#c5c2ba]">
                        Total {formatPeriod(selectedMonth)}
                      </p>
                      <p className="mt-2 text-2xl font-bold text-[#1d2b23] dark:text-[#e8e5de]">
                        {formatCurrency(report.total_amount)}
                      </p>
                    </article>
                    <article className="rounded-2xl border border-[#e5ebe7] bg-white p-5 shadow-sm dark:border-[#616161] dark:bg-[#1c2d35]">
                      <p className="text-xs font-medium text-[#718078] dark:text-[#c5c2ba]">
                        Jumlah transaksi
                      </p>
                      <p className="mt-2 text-2xl font-bold text-[#1d2b23] dark:text-[#e8e5de]">
                        {transactionCount.toLocaleString('id-ID')}
                      </p>
                    </article>
                  </section>

                  <section className="overflow-hidden rounded-2xl border border-[#e5ebe7] bg-white shadow-sm dark:border-[#616161] dark:bg-[#1c2d35]">
                    <div className="border-b border-[#e7ece8] px-4 py-4 dark:border-[#424242] sm:px-5">
                      <h3 className="font-bold text-[#26382e] dark:text-[#e8e5de]">
                        Riwayat pembayaran
                      </h3>
                      <p className="mt-1 text-xs text-[#718078] dark:text-[#c5c2ba]">
                        {formatPeriod(selectedMonth)}
                        {reportStudentId !== 'all'
                          ? ` · ${students.find((student) => String(student.id) === reportStudentId)?.nama_lengkap ?? ''}`
                          : ' · Semua siswa'}
                      </p>
                    </div>
                    {report.transactions.length ? (
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[680px] text-left text-sm">
                          <thead className="bg-[#f7f9f7] text-xs text-[#65736a] dark:bg-[#23343c] dark:text-[#c5c2ba]">
                            <tr>
                              <th className="px-4 py-3 font-semibold sm:px-5">
                                Tanggal
                              </th>
                              <th className="px-4 py-3 font-semibold">
                                Siswa
                              </th>
                              <th className="px-4 py-3 font-semibold">
                                Jenis pembayaran
                              </th>
                              <th className="px-4 py-3 text-right font-semibold">
                                Jumlah
                              </th>
                              <th className="px-4 py-3 font-semibold">
                                Catatan
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#edf0ed] dark:divide-[#424242]">
                            {report.transactions.map((transaction) => (
                              <tr key={transaction.id}>
                                <td className="whitespace-nowrap px-4 py-3 text-[#65736a] dark:text-[#c5c2ba] sm:px-5">
                                  {formatDate(transaction.paid_at)}
                                </td>
                                <td className="px-4 py-3 font-medium text-[#26382e] dark:text-[#e8e5de]">
                                  {transaction.student_name}
                                </td>
                                <td className="px-4 py-3 text-[#65736a] dark:text-[#c5c2ba]">
                                  {transaction.category_name}
                                </td>
                                <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-[#0f5132] dark:text-[#ffd166]">
                                  {formatCurrency(transaction.amount)}
                                </td>
                                <td className="max-w-48 truncate px-4 py-3 text-[#65736a] dark:text-[#c5c2ba]">
                                  {transaction.note || '—'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="px-5 py-10 text-center text-sm text-[#718078] dark:text-[#c5c2ba]">
                        Belum ada transaksi pada periode ini.
                      </p>
                    )}
                  </section>
                </>
              ) : null}
            </section>
          </section>

          <p className="text-xs leading-5 text-[#718078] dark:text-[#c5c2ba]">
            Laporan hanya menampilkan kategori pembayaran yang ditugaskan ke
            akun Anda. Hak akses transaksi tetap divalidasi oleh server.
          </p>
        </>
      )}
    </div>
  )
}
