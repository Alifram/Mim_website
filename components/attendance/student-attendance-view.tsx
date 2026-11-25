'use client'

import { useMemo, useState } from 'react'
import {
  CalendarDays,
  Check,
  CircleAlert,
  Clock3,
  X,
} from 'lucide-react'

import type {
  AttendanceHistory,
  AttendanceStatus,
} from '@/lib/services/attendance/attendance-types'

type StudentAttendanceViewProps = {
  history: AttendanceHistory
  initialMonth: string
  studentName: string
  studentNumber: string
}

const statusStyles: Record<
  AttendanceStatus,
  { color: string; icon: typeof Check }
> = {
  Hadir: {
    color: 'bg-emerald-50 text-emerald-800 dark:bg-[#183b2c] dark:text-[#b9f4d0]',
    icon: Check,
  },
  Sakit: {
    color: 'bg-amber-50 text-amber-800 dark:bg-[#3b3020] dark:text-[#ffe0a3]',
    icon: CircleAlert,
  },
  Izin: {
    color: 'bg-blue-50 text-blue-800 dark:bg-[#1c3040] dark:text-[#b9dcff]',
    icon: Clock3,
  },
  Alpa: {
    color: 'bg-rose-50 text-rose-800 dark:bg-[#351d22] dark:text-[#ffc5c5]',
    icon: X,
  },
}

const statuses: AttendanceStatus[] = ['Hadir', 'Sakit', 'Izin', 'Alpa']

function formatMonth(month: string) {
  return new Intl.DateTimeFormat('id-ID', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${month}-01T00:00:00Z`))
}

function formatAttendanceDate(date: string) {
  return new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Jakarta',
  }).format(new Date(`${date}T00:00:00+07:00`))
}

export default function StudentAttendanceView({
  history,
  initialMonth,
  studentName,
  studentNumber,
}: StudentAttendanceViewProps) {
  const [month, setMonth] = useState(initialMonth)

  const monthRecords = useMemo(
    () => history.records.filter((record) => record.tanggal.startsWith(month)),
    [history.records, month],
  )

  const statusCounts = useMemo(
    () =>
      Object.fromEntries(
        statuses.map((status) => [
          status,
          monthRecords.filter((record) => record.status === status).length,
        ]),
      ) as Record<AttendanceStatus, number>,
    [monthRecords],
  )

  const attendanceRate =
    monthRecords.length > 0
      ? Math.round((statusCounts.Hadir / monthRecords.length) * 100)
      : null

  return (
    <div className="space-y-5">
      <section className="rounded-2xl bg-gradient-to-br from-[#0f5132] to-[#24734b] p-5 text-white shadow-sm sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-white/70">
              Presensi Siswa
            </p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight">
              Kehadiran Saya
            </h2>
            <p className="mt-2 text-sm text-white/85">
              {studentName} <span className="text-white/60">·</span>{' '}
              {studentNumber}
            </p>
            <p className="mt-1 text-xs text-white/70">
              Lihat catatan kehadiran pribadi Anda.
            </p>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap items-end justify-between gap-3 border-t border-white/20 pt-4">
          <div>
            <p className="text-xs font-medium text-white/70">
              Kehadiran bulan {formatMonth(month)}
            </p>
            <p className="mt-1 text-3xl font-bold">
              {attendanceRate === null ? '—' : `${attendanceRate}%`}
            </p>
          </div>
          <p className="text-xs text-white/75">
            {monthRecords.length} hari tercatat
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-[#e5ebe7] bg-white p-4 shadow-sm dark:border-[#616161] dark:bg-[#1c2d35] sm:p-5">
        <label
          className="mb-1.5 block text-xs font-semibold text-[#35463b] dark:text-[#e8e5de]"
          htmlFor="student-attendance-month"
        >
          Periode rekap
        </label>
        <div className="flex items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#eaf3ed] text-[#0f5132] dark:bg-[#34434b] dark:text-[#ffd166]">
            <CalendarDays aria-hidden="true" size={19} />
          </span>
          <input
            className="min-h-11 w-full max-w-xs rounded-xl border border-[#dce5df] bg-white px-3.5 text-sm text-[#26382e] outline-none transition focus:border-[#0f5132] focus:ring-2 focus:ring-[#0f5132]/10 dark:border-[#616161] dark:bg-[#111b21] dark:text-[#e8e5de] dark:focus:border-[#ffd166]"
            id="student-attendance-month"
            max={initialMonth}
            min="2020-01"
            onChange={(event) => {
              const nextMonth = event.target.value
              if (/^\d{4}-\d{2}$/.test(nextMonth)) setMonth(nextMonth)
            }}
            required
            type="month"
            value={month}
          />
        </div>
      </section>

      <section
        aria-label={`Ringkasan presensi ${formatMonth(month)}`}
        className="grid grid-cols-2 gap-3 lg:grid-cols-4"
      >
        {statuses.map((status) => {
          const Icon = statusStyles[status].icon

          return (
            <article
              className="rounded-2xl border border-[#e5ebe7] bg-white p-4 shadow-sm dark:border-[#616161] dark:bg-[#1c2d35] sm:p-5"
              key={status}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-medium text-[#718078] dark:text-[#c5c2ba]">
                  {status}
                </p>
                <span
                  className={`grid size-8 place-items-center rounded-lg ${statusStyles[status].color}`}
                >
                  <Icon aria-hidden="true" size={16} />
                </span>
              </div>
              <p className="mt-3 text-2xl font-bold text-[#1d2b23] dark:text-[#e8e5de]">
                {statusCounts[status].toLocaleString('id-ID')}
              </p>
              <p className="mt-1 text-[11px] text-[#718078] dark:text-[#c5c2ba]">
                catatan
              </p>
            </article>
          )
        })}
      </section>

      {history.hasMore ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-900 dark:border-[#795d23] dark:bg-[#3b3020] dark:text-[#ffe0a3]">
          Riwayat yang dimuat dibatasi hingga 500 catatan terbaru. Rekap bulan
          yang lebih lama mungkin belum lengkap.
        </p>
      ) : null}

      <section className="overflow-hidden rounded-2xl border border-[#e5ebe7] bg-white shadow-sm dark:border-[#616161] dark:bg-[#1c2d35]">
        <div className="border-b border-[#e7ece8] px-4 py-4 dark:border-[#424242] sm:px-5">
          <h3 className="font-bold text-[#26382e] dark:text-[#e8e5de]">
            Riwayat {formatMonth(month)}
          </h3>
          <p className="mt-1 text-xs text-[#718078] dark:text-[#c5c2ba]">
            {monthRecords.length} catatan kehadiran
          </p>
        </div>

        {monthRecords.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <CalendarDays
              aria-hidden="true"
              className="mx-auto text-[#8a9990] dark:text-[#d8d5cd]"
              size={28}
            />
            <p className="mt-3 text-sm font-semibold text-[#26382e] dark:text-[#e8e5de]">
              Belum ada presensi pada bulan ini
            </p>
            <p className="mt-1 text-xs text-[#718078] dark:text-[#c5c2ba]">
              Pilih periode lain untuk melihat catatan sebelumnya.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-[#edf0ed] dark:divide-[#424242]">
            {monthRecords.map((record) => {
              const Icon = statusStyles[record.status].icon
              return (
                <li
                  className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"
                  key={`${record.sesi_id}-${record.siswa_id}`}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-[#26382e] dark:text-[#e8e5de]">
                      {formatAttendanceDate(record.tanggal)}
                    </p>
                    <p className="mt-1 text-xs text-[#718078] dark:text-[#c5c2ba]">
                      {record.kelas} <span className="px-1">·</span> Guru:{' '}
                      {record.nama_guru}
                    </p>
                    {record.catatan ? (
                      <p className="mt-2 text-xs leading-5 text-[#65736a] dark:text-[#c5c2ba]">
                        Catatan: {record.catatan}
                      </p>
                    ) : null}
                  </div>
                  <span
                    className={`inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${statusStyles[record.status].color}`}
                  >
                    <Icon aria-hidden="true" size={14} />
                    {record.status}
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}
