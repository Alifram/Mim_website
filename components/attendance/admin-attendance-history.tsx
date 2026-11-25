'use client'

import { useMemo, useRef, useState } from 'react'
import {
  CalendarDays,
  Check,
  CircleAlert,
  Clock3,
  Search,
  UsersRound,
  X,
} from 'lucide-react'

import type {
  AttendanceClass,
  AttendanceRecord,
  AttendanceStatus,
} from '@/lib/services/attendance/attendance-types'
import { fetchAdminAttendanceHistory } from '@/lib/services/attendance/attendance-query-service'

type AdminAttendanceHistoryProps = {
  classes: AttendanceClass[]
  date: string
  records: AttendanceRecord[]
  hasMore: boolean
  initialError: string | null
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

const inputClassName =
  'min-h-11 w-full rounded-xl border border-[#dce5df] bg-white px-3.5 text-sm text-[#26382e] outline-none transition focus:border-[#0f5132] focus:ring-2 focus:ring-[#0f5132]/10 dark:border-[#616161] dark:bg-[#111b21] dark:text-[#e8e5de] dark:focus:border-[#ffd166]'

function formatDate(date: string) {
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'long',
    timeZone: 'Asia/Jakarta',
  }).format(new Date(`${date}T00:00:00+07:00`))
}

export default function AdminAttendanceHistory({
  classes,
  date,
  records: initialRecords,
  hasMore: initialHasMore,
  initialError,
}: AdminAttendanceHistoryProps) {
  const requestId = useRef(0)
  const [selectedDate, setSelectedDate] = useState(date)
  const [selectedClass, setSelectedClass] = useState('all')
  const [records, setRecords] = useState(initialRecords)
  const [hasMore, setHasMore] = useState(initialHasMore)
  const [loadError, setLoadError] = useState(initialError)
  const [isLoading, setIsLoading] = useState(false)
  const [search, setSearch] = useState('')

  const maxDate = useMemo(() => {
    const maximum = new Date(`${date}T00:00:00Z`)
    maximum.setUTCDate(maximum.getUTCDate() + 365)
    return maximum.toISOString().slice(0, 10)
  }, [date])

  const filteredRecords = useMemo(() => {
    const query = search.trim().toLocaleLowerCase()
    if (!query) return records

    return records.filter((record) =>
      [
        record.nama_siswa,
        record.nomor_induk,
        record.kelas,
        record.nama_guru,
        record.catatan ?? '',
      ]
        .join(' ')
        .toLocaleLowerCase()
        .includes(query),
    )
  }, [records, search])

  const statusCounts = useMemo(
    () => ({
      Hadir: records.filter((record) => record.status === 'Hadir').length,
      Sakit: records.filter((record) => record.status === 'Sakit').length,
      Izin: records.filter((record) => record.status === 'Izin').length,
      Alpa: records.filter((record) => record.status === 'Alpa').length,
    }),
    [records],
  )

  async function loadHistory(nextDate: string, nextClass: string) {
    const request = ++requestId.current
    const classId = nextClass === 'all' ? null : Number(nextClass)

    setIsLoading(true)
    setLoadError(null)
    setRecords([])
    setHasMore(false)

    const result = await fetchAdminAttendanceHistory(nextDate, classId)
    if (request !== requestId.current) return

    if (result.status === 'success') {
      setRecords(result.history.records)
      setHasMore(result.history.hasMore)
    } else {
      setLoadError(result.message)
    }
    setIsLoading(false)
  }

  function changeClass(nextClass: string) {
    setSelectedClass(nextClass)
    void loadHistory(selectedDate, nextClass)
  }

  function changeDate(nextDate: string) {
    setSelectedDate(nextDate)
    void loadHistory(nextDate, selectedClass)
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#0f6a42] dark:text-[#ffd166]">
            Administrasi
          </p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-[#1d2b23] dark:text-[#e8e5de]">
            Riwayat Presensi
          </h2>
          <p className="mt-2 text-sm leading-6 text-[#65736a] dark:text-[#c5c2ba]">
            Pantau catatan kehadiran seluruh kelas berdasarkan tanggal.
          </p>
        </div>
      </header>

      <section className="rounded-2xl border border-[#e5ebe7] bg-white p-5 shadow-sm dark:border-[#616161] dark:bg-[#1c2d35] sm:p-6">
        <div className="mb-5 flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-[#eaf3ed] text-[#0f5132] dark:bg-[#34434b] dark:text-[#ffd166]">
            <CalendarDays aria-hidden="true" size={19} />
          </span>
          <div>
            <h3 className="text-sm font-bold text-[#26382e] dark:text-[#e8e5de]">
              Filter riwayat
            </h3>
            <p className="mt-0.5 text-xs text-[#718078] dark:text-[#c5c2ba]">
              Pilih kelas dan tanggal presensi yang ingin dilihat.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              className="mb-1.5 block text-xs font-semibold text-[#35463b] dark:text-[#e8e5de]"
              htmlFor="attendance-class"
            >
              Kelas
            </label>
            <select
              className={inputClassName}
              id="attendance-class"
              onChange={(event) => changeClass(event.target.value)}
              value={selectedClass}
            >
              <option value="all">Semua kelas</option>
              {classes.map((schoolClass) => (
                <option key={schoolClass.id} value={schoolClass.id}>
                  {schoolClass.nama}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              className="mb-1.5 block text-xs font-semibold text-[#35463b] dark:text-[#e8e5de]"
              htmlFor="attendance-date"
            >
              Tanggal riwayat
            </label>
            <input
              className={inputClassName}
              id="attendance-date"
              max={maxDate}
              min="2020-01-01"
              onChange={(event) => changeDate(event.target.value)}
              type="date"
              value={selectedDate}
            />
          </div>
        </div>
        <p className="mt-3 text-xs text-[#718078] dark:text-[#c5c2ba]">
          Menampilkan riwayat untuk {formatDate(selectedDate)}.
        </p>
      </section>

      <section aria-label="Ringkasan status presensi" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {(Object.keys(statusCounts) as AttendanceStatus[]).map((status) => {
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
                catatan siswa
              </p>
            </article>
          )
        })}
      </section>

      <section className="overflow-hidden rounded-2xl border border-[#e5ebe7] bg-white shadow-sm dark:border-[#616161] dark:bg-[#1c2d35]">
        <div className="flex flex-col gap-3 border-b border-[#e7ece8] p-4 dark:border-[#424242] sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div>
            <h3 className="text-sm font-bold text-[#26382e] dark:text-[#e8e5de]">
              Catatan kehadiran
            </h3>
            <p className="mt-1 text-xs text-[#718078] dark:text-[#c5c2ba]">
              {records.length.toLocaleString('id-ID')} catatan
              {selectedClass === 'all'
                ? ' · semua kelas'
                : ` · ${classes.find((schoolClass) => schoolClass.id === Number(selectedClass))?.nama ?? ''}`}
            </p>
          </div>
          <div className="relative w-full sm:max-w-xs">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#829087] dark:text-[#d8d5cd]"
              size={16}
            />
            <input
              aria-label="Cari catatan presensi"
              className={`${inputClassName} pl-9`}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari nama, NIS, kelas"
              type="search"
              value={search}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="px-5 py-14 text-center">
            <div
              aria-label="Memuat riwayat presensi"
              className="mx-auto size-6 animate-spin rounded-full border-2 border-[#dce5df] border-t-[#0f5132] dark:border-[#424242] dark:border-t-[#ffd166]"
              role="status"
            />
            <p className="mt-3 text-xs text-[#718078] dark:text-[#c5c2ba]">
              Memuat riwayat presensi…
            </p>
          </div>
        ) : loadError ? (
          <div className="px-5 py-12 text-center">
            <p
              className="text-sm leading-6 text-[#9c2c2c] dark:text-[#ffc5c5]"
              role="alert"
            >
              {loadError}
            </p>
            <button
              className="mt-4 min-h-10 rounded-xl bg-[#0f5132] px-4 text-xs font-semibold text-white dark:bg-[#ffd166] dark:text-[#172027]"
              onClick={() => void loadHistory(selectedDate, selectedClass)}
              type="button"
            >
              Coba lagi
            </button>
          </div>
        ) : filteredRecords.length ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse text-left">
                <thead>
                  <tr className="bg-[#f7f9f7] text-[11px] font-semibold uppercase tracking-[0.08em] text-[#718078] dark:bg-[#111b21] dark:text-[#c5c2ba]">
                    <th className="px-5 py-3.5" scope="col">
                      Siswa
                    </th>
                    <th className="px-5 py-3.5" scope="col">
                      Kelas
                    </th>
                    <th className="px-5 py-3.5" scope="col">
                      Guru pencatat
                    </th>
                    <th className="px-5 py-3.5" scope="col">
                      Status
                    </th>
                    <th className="px-5 py-3.5" scope="col">
                      Catatan
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#edf0ed] dark:divide-[#424242]">
                  {filteredRecords.map((record) => {
                    const Icon = statusStyles[record.status].icon
                    return (
                      <tr
                        className="transition hover:bg-[#f9fbf9] dark:hover:bg-[#34434b]/40"
                        key={`${record.sesi_id}-${record.siswa_id}`}
                      >
                        <td className="px-5 py-4">
                          <div className="text-sm font-semibold text-[#26382e] dark:text-[#e8e5de]">
                            {record.nama_siswa}
                          </div>
                          <div className="mt-1 text-xs text-[#718078] dark:text-[#c5c2ba]">
                            NIS {record.nomor_induk}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-sm text-[#65736a] dark:text-[#c5c2ba]">
                          {record.kelas}
                        </td>
                        <td className="px-5 py-4 text-sm text-[#65736a] dark:text-[#c5c2ba]">
                          {record.nama_guru}
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[record.status].color}`}
                          >
                            <Icon aria-hidden="true" size={13} />
                            {record.status}
                          </span>
                        </td>
                        <td className="max-w-56 px-5 py-4 text-sm text-[#65736a] dark:text-[#c5c2ba]">
                          {record.catatan || '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div className="flex flex-col gap-2 border-t border-[#e7ece8] px-5 py-3 text-xs text-[#718078] dark:border-[#424242] dark:text-[#c5c2ba] sm:flex-row sm:items-center sm:justify-between">
              <p>
                Menampilkan {filteredRecords.length.toLocaleString('id-ID')} dari{' '}
                {records.length.toLocaleString('id-ID')} catatan.
              </p>
              {hasMore ? (
                <p role="status">
                  Hasil mencapai batas 500 catatan. Persempit filter tanggal atau
                  kelas untuk melihat data yang lebih spesifik.
                </p>
              ) : null}
            </div>
          </>
        ) : (
          <div className="px-5 py-14 text-center">
            <UsersRound
              aria-hidden="true"
              className="mx-auto text-[#8a9990] dark:text-[#d8d5cd]"
              size={28}
            />
            <h4 className="mt-3 text-sm font-semibold text-[#26382e] dark:text-[#e8e5de]">
              {records.length ? 'Catatan tidak ditemukan' : 'Belum ada riwayat presensi'}
            </h4>
            <p className="mt-1 text-xs text-[#718078] dark:text-[#c5c2ba]">
              {records.length
                ? 'Coba ubah kata kunci pencarian.'
                : `Belum ada catatan presensi untuk ${formatDate(selectedDate)}.`}
            </p>
          </div>
        )}
      </section>
    </div>
  )
}
