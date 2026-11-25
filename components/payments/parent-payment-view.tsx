'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  CalendarDays,
  CreditCard,
  HeartHandshake,
  ReceiptText,
  UsersRound,
} from 'lucide-react'

import { fetchParentPaymentReport } from '@/lib/services/payments/parent-payment-query-service'
import type {
  MonthlyPaymentReport,
  ParentLinkedStudent,
} from '@/lib/services/payments/payment-types'

type ParentPaymentViewProps = {
  initialMonth: string
  initialReport: MonthlyPaymentReport | null
  initialReportError: string | null
  initialStudentId: number | null
  parentName: string
  students: ParentLinkedStudent[]
}

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

export default function ParentPaymentView({
  initialMonth,
  initialReport,
  initialReportError,
  initialStudentId,
  parentName,
  students,
}: ParentPaymentViewProps) {
  const requestId = useRef(0)
  const [selectedMonth, setSelectedMonth] = useState(initialMonth)
  const [selectedStudentId, setSelectedStudentId] = useState(initialStudentId)
  const [report, setReport] = useState(initialReport)
  const [reportError, setReportError] = useState(initialReportError)
  const [isLoading, setIsLoading] = useState(false)

  const selectedStudent =
    students.find((student) => student.id === selectedStudentId) ?? null
  const transactionCount = useMemo(
    () =>
      report?.totals.reduce(
        (total, category) => total + category.transaction_count,
        0,
      ) ?? 0,
    [report],
  )
  const maxMonth = initialMonth
  const minMonth = `${new Date(`${initialMonth}-01T00:00:00Z`).getUTCFullYear() - 6}-01`

  useEffect(() => () => {
    requestId.current += 1
  }, [])

  async function loadReport(studentId: number | null, periodValue: string) {
    const period = parsePeriod(periodValue)
    if (!studentId || !period) {
      setReport(null)
      setReportError('Pilih anak dan periode laporan yang valid.')
      return
    }

    const request = ++requestId.current
    setIsLoading(true)
    setReport(null)
    setReportError(null)

    const result = await fetchParentPaymentReport(
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
    setIsLoading(false)
  }

  function handleStudentChange(value: string) {
    const nextStudentId = Number(value)
    if (!students.some((student) => student.id === nextStudentId)) return

    setSelectedStudentId(nextStudentId)
    void loadReport(nextStudentId, selectedMonth)
  }

  function handleMonthChange(value: string) {
    if (!parsePeriod(value)) return
    setSelectedMonth(value)
    void loadReport(selectedStudentId, value)
  }

  return (
    <div className="space-y-5">
      <section className="rounded-2xl bg-gradient-to-br from-[#0f5132] to-[#24734b] p-5 text-white shadow-sm sm:p-6">
        <div className="flex items-start gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-white/15">
            <HeartHandshake aria-hidden="true" size={22} />
          </span>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-white/70">
              Layanan Orang Tua
            </p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight">
              Infaq &amp; Wakaf
            </h2>
            <p className="mt-2 text-sm text-white/85">
              Halo, {parentName}. Pantau transaksi anak yang terhubung.
            </p>
          </div>
        </div>
      </section>

      {students.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-[#dce5df] bg-white px-5 py-12 text-center dark:border-[#616161] dark:bg-[#1c2d35]">
          <UsersRound
            aria-hidden="true"
            className="mx-auto text-[#8a9990] dark:text-[#d8d5cd]"
            size={32}
          />
          <h3 className="mt-3 text-base font-semibold text-[#26382e] dark:text-[#e8e5de]">
            Belum ada anak yang ditautkan
          </h3>
          <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-[#718078] dark:text-[#c5c2ba]">
            Hubungi admin sekolah untuk menautkan akun siswa ke akun orang tua
            Anda.
          </p>
        </section>
      ) : (
        <>
          <section className="rounded-2xl border border-[#e5ebe7] bg-white p-4 shadow-sm dark:border-[#616161] dark:bg-[#1c2d35] sm:p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <label>
                <span className="mb-1.5 block text-xs font-semibold text-[#35463b] dark:text-[#e8e5de]">
                  Anak
                </span>
                <select
                  className="min-h-11 w-full rounded-xl border border-[#dce5df] bg-white px-3.5 text-sm text-[#26382e] outline-none focus:border-[#0f5132] focus:ring-2 focus:ring-[#0f5132]/10 dark:border-[#616161] dark:bg-[#111b21] dark:text-[#e8e5de] dark:focus:border-[#ffd166]"
                  onChange={(event) => handleStudentChange(event.target.value)}
                  value={selectedStudentId ?? ''}
                >
                  {students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.nama_lengkap}
                      {student.kelas_nama ? ` — ${student.kelas_nama}` : ''}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span className="mb-1.5 block text-xs font-semibold text-[#35463b] dark:text-[#e8e5de]">
                  Bulan laporan
                </span>
                <span className="relative block">
                  <CalendarDays
                    aria-hidden="true"
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#718078] dark:text-[#c5c2ba]"
                    size={17}
                  />
                  <input
                    className="min-h-11 w-full rounded-xl border border-[#dce5df] bg-white pl-10 pr-3.5 text-sm text-[#26382e] outline-none focus:border-[#0f5132] focus:ring-2 focus:ring-[#0f5132]/10 dark:border-[#616161] dark:bg-[#111b21] dark:text-[#e8e5de] dark:focus:border-[#ffd166]"
                    max={maxMonth}
                    min={minMonth}
                    onChange={(event) => handleMonthChange(event.target.value)}
                    required
                    type="month"
                    value={selectedMonth}
                  />
                </span>
              </label>
            </div>
            {selectedStudent ? (
              <p className="mt-3 text-xs text-[#718078] dark:text-[#c5c2ba]">
                Menampilkan transaksi {selectedStudent.nama_lengkap} untuk{' '}
                {formatPeriod(selectedMonth)}.
              </p>
            ) : null}
          </section>

          {reportError ? (
            <p
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200"
              role="alert"
            >
              {reportError}
            </p>
          ) : null}

          {isLoading ? (
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
                aria-label="Ringkasan Infaq dan Wakaf"
                className="grid gap-3 sm:grid-cols-2"
              >
                <article className="rounded-2xl border border-[#e5ebe7] bg-white p-5 shadow-sm dark:border-[#616161] dark:bg-[#1c2d35]">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-medium text-[#718078] dark:text-[#c5c2ba]">
                        Total tercatat bulan ini
                      </p>
                      <p className="mt-2 text-2xl font-bold text-[#1d2b23] dark:text-[#e8e5de]">
                        {formatCurrency(report.total_amount)}
                      </p>
                    </div>
                    <span className="grid size-10 place-items-center rounded-xl bg-[#eaf3ed] text-[#0f5132] dark:bg-[#34434b] dark:text-[#ffd166]">
                      <CreditCard aria-hidden="true" size={19} />
                    </span>
                  </div>
                </article>
                <article className="rounded-2xl border border-[#e5ebe7] bg-white p-5 shadow-sm dark:border-[#616161] dark:bg-[#1c2d35]">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-medium text-[#718078] dark:text-[#c5c2ba]">
                        Jumlah transaksi
                      </p>
                      <p className="mt-2 text-2xl font-bold text-[#1d2b23] dark:text-[#e8e5de]">
                        {transactionCount.toLocaleString('id-ID')}
                      </p>
                    </div>
                    <span className="grid size-10 place-items-center rounded-xl bg-[#eaf3ed] text-[#0f5132] dark:bg-[#34434b] dark:text-[#ffd166]">
                      <ReceiptText aria-hidden="true" size={19} />
                    </span>
                  </div>
                </article>
              </section>

              <section className="space-y-3">
                <div>
                  <h3 className="font-bold text-[#26382e] dark:text-[#e8e5de]">
                    Rincian per jenis
                  </h3>
                  <p className="mt-1 text-xs text-[#718078] dark:text-[#c5c2ba]">
                    Ringkasan transaksi Infaq dan Wakaf pada periode ini.
                  </p>
                </div>
                {report.totals.length ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {report.totals.map((total) => (
                      <article
                        className="rounded-2xl border border-[#e5ebe7] bg-white p-4 shadow-sm dark:border-[#616161] dark:bg-[#1c2d35] sm:p-5"
                        key={total.category_code}
                      >
                        <div className="flex items-center gap-3">
                          <span className="grid size-10 place-items-center rounded-xl bg-[#eaf3ed] text-[#0f5132] dark:bg-[#34434b] dark:text-[#ffd166]">
                            <HeartHandshake aria-hidden="true" size={18} />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-[#26382e] dark:text-[#e8e5de]">
                              {total.category_name}
                            </p>
                            <p className="mt-0.5 text-xs text-[#718078] dark:text-[#c5c2ba]">
                              {total.transaction_count.toLocaleString('id-ID')}{' '}
                              transaksi
                            </p>
                          </div>
                          <p className="shrink-0 text-sm font-bold text-[#0f5132] dark:text-[#ffd166]">
                            {formatCurrency(total.amount)}
                          </p>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className="rounded-xl border border-dashed border-[#dce5df] bg-white px-4 py-5 text-sm text-[#718078] dark:border-[#616161] dark:bg-[#1c2d35] dark:text-[#c5c2ba]">
                    Belum ada transaksi Infaq atau Wakaf pada bulan ini.
                  </p>
                )}
              </section>

              <section className="overflow-hidden rounded-2xl border border-[#e5ebe7] bg-white shadow-sm dark:border-[#616161] dark:bg-[#1c2d35]">
                <div className="border-b border-[#e7ece8] px-4 py-4 dark:border-[#424242] sm:px-5">
                  <h3 className="font-bold text-[#26382e] dark:text-[#e8e5de]">
                    Riwayat transaksi
                  </h3>
                  <p className="mt-1 text-xs text-[#718078] dark:text-[#c5c2ba]">
                    {formatPeriod(selectedMonth)}
                  </p>
                </div>
                {report.transactions.length ? (
                  <ul className="divide-y divide-[#edf0ed] dark:divide-[#424242]">
                    {report.transactions.map((transaction) => (
                      <li
                        className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"
                        key={transaction.id}
                      >
                        <div className="flex min-w-0 items-start gap-3">
                          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#eaf3ed] text-[#0f5132] dark:bg-[#34434b] dark:text-[#ffd166]">
                            <ReceiptText aria-hidden="true" size={18} />
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-[#26382e] dark:text-[#e8e5de]">
                              {transaction.category_name}
                            </p>
                            <p className="mt-1 text-xs text-[#718078] dark:text-[#c5c2ba]">
                              {formatDate(transaction.paid_at)}
                              {transaction.recorded_by_name
                                ? ` · Dicatat ${transaction.recorded_by_name}`
                                : ''}
                            </p>
                            {transaction.note ? (
                              <p className="mt-1 text-xs leading-5 text-[#65736a] dark:text-[#c5c2ba]">
                                {transaction.note}
                              </p>
                            ) : null}
                          </div>
                        </div>
                        <p className="shrink-0 pl-[52px] text-sm font-bold text-[#0f5132] dark:text-[#ffd166] sm:pl-0">
                          {formatCurrency(transaction.amount)}
                        </p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="px-5 py-10 text-center text-sm text-[#718078] dark:text-[#c5c2ba]">
                    Belum ada transaksi pada bulan ini.
                  </p>
                )}
              </section>

              <p className="text-xs leading-5 text-[#718078] dark:text-[#c5c2ba]">
                Halaman ini hanya menampilkan transaksi Infaq dan Wakaf yang
                telah dicatat oleh petugas sekolah.
              </p>
            </>
          ) : null}
        </>
      )}
    </div>
  )
}
