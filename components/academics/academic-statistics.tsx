'use client'

import { useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlertTriangle,
  ArrowLeft,
  Bolt,
  ChartNoAxesCombined,
  Search,
  UsersRound,
} from 'lucide-react'

import type { AdminMonitoringUser } from '@/lib/services/classes/class-service'
import {
  fetchAcademicStatistics,
} from '@/lib/services/academics/academic-statistics-query-service'
import { promoteStudents } from '@/lib/services/academics/student-promotion-service'
import type { AcademicClassStatistics } from '@/lib/services/academics/academic-statistics-types'

type AcademicStatisticsProps = {
  initialError: string | null
  initialRosterError: string | null
  initialStatistics: AcademicClassStatistics[]
  initialYear: number
  role: 'admin' | 'guru'
  users: AdminMonitoringUser[]
}

type Feedback = {
  status: 'success' | 'error'
  message: string
}

const fieldClassName =
  'min-h-11 w-full rounded-xl border border-[#dce5df] bg-white px-3.5 text-sm text-[#26382e] outline-none transition focus:border-[#0f5132] focus:ring-2 focus:ring-[#0f5132]/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-[#616161] dark:bg-[#111b21] dark:text-[#e8e5de] dark:focus:border-[#ffd166] dark:focus:ring-[#ffd166]/10'

export default function AcademicStatistics({
  initialError,
  initialRosterError,
  initialStatistics,
  initialYear,
  role,
  users,
}: AcademicStatisticsProps) {
  const router = useRouter()
  const requestId = useRef(0)
  const [year, setYear] = useState(initialYear)
  const [statistics, setStatistics] = useState(initialStatistics)
  const [statisticsError, setStatisticsError] = useState(initialError)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedClass, setSelectedClass] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [selectedRole, setSelectedRole] = useState('semua')
  const [selectedAdmissionYear, setSelectedAdmissionYear] = useState(
    String(initialYear),
  )
  const [promotionOpen, setPromotionOpen] = useState(false)
  const [accessDeniedOpen, setAccessDeniedOpen] = useState(false)
  const [acknowledged, setAcknowledged] = useState(false)
  const [isPromoting, setIsPromoting] = useState(false)
  const [promotionCompleted, setPromotionCompleted] = useState(false)
  const [feedback, setFeedback] = useState<Feedback | null>(null)

  const yearOptions = useMemo(() => {
    const firstYear = year < 2023 ? year : 2023
    const lastYear = Math.max(initialYear + 5, year)
    return Array.from(
      { length: lastYear - firstYear + 1 },
      (_, index) => firstYear + index,
    )
  }, [initialYear, year])

  const admissionYearOptions = useMemo(() => {
    const years = new Set<number>()
    for (const user of users) {
      if (user.role === 'siswa' && user.tahun_angkatan !== null) {
        years.add(user.tahun_angkatan)
      }
    }
    years.add(year)
    return [
      'Semua Angkatan',
      ...Array.from(years)
        .sort((first, second) => second - first)
        .map(String),
    ]
  }, [users, year])

  const visibleUsers = useMemo(() => {
    if (selectedClass === null) return []

    const normalizedQuery = query.trim().toLocaleLowerCase()
    return users
      .filter((user) => {
        const matchesRole =
          selectedRole === 'semua' ||
          (selectedRole === 'guru_kelas' &&
            user.role === 'guru' &&
            user.jenis_guru === 'guru_kelas') ||
          (selectedRole === 'guru_mapel' &&
            user.role === 'guru' &&
            user.jenis_guru === 'guru_mapel') ||
          (selectedRole === 'siswa' && user.role === 'siswa')
        const matchesClass =
          user.role === 'siswa' || user.jenis_guru === 'guru_kelas'
            ? user.kelas_nama === selectedClass
            : user.kelas_mapel_nama.includes(selectedClass)
        const matchesAdmissionYear =
          user.role !== 'siswa' ||
          selectedAdmissionYear === 'Semua Angkatan' ||
          String(user.tahun_angkatan) === selectedAdmissionYear
        const searchableText = [
          user.nama_lengkap,
          user.nomor_induk,
          user.kelas_nama ?? '',
          user.tahun_angkatan?.toString() ?? '',
        ]
          .join(' ')
          .toLocaleLowerCase()

        return (
          matchesRole &&
          matchesClass &&
          matchesAdmissionYear &&
          searchableText.includes(normalizedQuery)
        )
      })
      .sort((first, second) =>
        first.nama_lengkap.localeCompare(second.nama_lengkap, 'id'),
      )
  }, [query, selectedAdmissionYear, selectedClass, selectedRole, users])

  async function loadStatistics(admissionYear: number) {
    const request = ++requestId.current
    setIsLoading(true)
    setStatisticsError(null)
    const result = await fetchAcademicStatistics(admissionYear)

    if (request !== requestId.current) return

    if (result.status === 'success') {
      setStatistics(result.statistics)
      setStatisticsError(null)
    } else {
      setStatistics([])
      setStatisticsError(result.message)
    }
    setIsLoading(false)
  }

  function handleYearChange(value: string) {
    const nextYear = Number(value)
    if (!Number.isSafeInteger(nextYear)) return

    setYear(nextYear)
    setSelectedClass(null)
    setQuery('')
    setFeedback(null)
    void loadStatistics(nextYear)
  }

  function openPromotionDialog() {
    setAcknowledged(false)
    setPromotionOpen(true)
  }

  async function confirmPromotion() {
    if (!acknowledged || isPromoting) return

    setIsPromoting(true)
    setFeedback(null)
    const result = await promoteStudents()
    setIsPromoting(false)

    if (result.status === 'error') {
      setPromotionOpen(false)
      setFeedback({ status: 'error', message: result.message })
      return
    }

    const movedCount = result.movedCounts.reduce(
      (total, count) => total + count,
      0,
    )
    setPromotionOpen(false)
    setPromotionCompleted(true)
    setFeedback({
      status: 'success',
      message: `Kenaikan kelas massal berhasil. ${movedCount.toLocaleString('id-ID')} siswa dipindahkan.`,
    })
    void loadStatistics(year)
    router.refresh()
  }

  return (
    <div className="space-y-6">
      {selectedClass ? (
        <section className="flex flex-col gap-5 rounded-2xl border border-[#e5ebe7] bg-white p-5 shadow-sm dark:border-[#616161] dark:bg-[#1c2d35] sm:flex-row sm:items-center sm:justify-between">
          <div>
            <button
              className="mb-4 inline-flex min-h-9 items-center gap-2 rounded-lg text-sm font-semibold text-[#0f5132] hover:underline disabled:cursor-not-allowed dark:text-[#ffd166]"
              onClick={() => {
                setSelectedClass(null)
                setQuery('')
                setFeedback(null)
              }}
              type="button"
            >
              <ArrowLeft aria-hidden="true" size={16} />
              Kembali ke Statistik Akademik
            </button>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#0f6a42] dark:text-[#ffd166]">
              Pantau Semua Data
            </p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-[#1d2b23] dark:text-[#e8e5de]">
              {selectedClass}
            </h2>
            <p className="mt-1 text-sm text-[#65736a] dark:text-[#c5c2ba]">
              Mengunci penghuni kelas {selectedClass} · Angkatan{' '}
              {selectedAdmissionYear}
            </p>
          </div>
          <button
            aria-label="Otomatisasi kenaikan kelas massal"
            className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#0f5132] px-4 text-sm font-semibold text-white transition hover:bg-[#0b4229] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[#ffd166] dark:text-[#26382e] dark:hover:bg-[#f2c65d]"
            disabled={isPromoting || promotionCompleted}
            onClick={openPromotionDialog}
            title="Otomatisasi kenaikan kelas massal"
            type="button"
          >
            <Bolt aria-hidden="true" size={18} />
            {promotionCompleted
              ? 'Kenaikan kelas sudah dijalankan'
              : 'Kenaikan kelas massal'}
          </button>
        </section>
      ) : (
        <section className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#0f6a42] dark:text-[#ffd166]">
              Akademik
            </p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-[#1d2b23] dark:text-[#e8e5de]">
              Statistik Akademik
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#65736a] dark:text-[#c5c2ba]">
              Bandingkan nilai rata-rata per kelas dan pantau data siswa
              berdasarkan tahun angkatan.
            </p>
          </div>

          <label className="w-full sm:max-w-xs">
            <span className="mb-1.5 block text-xs font-semibold text-[#35463b] dark:text-[#e8e5de]">
              Tahun angkatan siswa
            </span>
            <select
              className={fieldClassName}
              disabled={isLoading}
              onChange={(event) => handleYearChange(event.target.value)}
              value={year}
            >
              {yearOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        </section>
      )}

      {feedback && selectedClass ? (
        <p
          className={
            feedback.status === 'success'
              ? 'rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200'
              : 'rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-[#795d23] dark:bg-[#3b3020] dark:text-[#ffe0a3]'
          }
          role={feedback.status === 'error' ? 'alert' : 'status'}
        >
          {feedback.message}
          {feedback.status === 'error' ? (
            <span className="mt-1 block">
              Periksa kembali data kelas sebelum mencoba lagi.
            </span>
          ) : null}
        </p>
      ) : null}

      {!selectedClass && statisticsError ? (
        <div
          className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-[#795d23] dark:bg-[#3b3020] dark:text-[#ffe0a3] sm:flex-row sm:items-center sm:justify-between"
          role="alert"
        >
          <span>{statisticsError}</span>
          <button
            className="min-h-9 rounded-lg border border-amber-300 px-3 font-semibold disabled:cursor-not-allowed disabled:opacity-60 dark:border-[#a27a2d]"
            disabled={isLoading}
            onClick={() => void loadStatistics(year)}
            type="button"
          >
            Coba lagi
          </button>
        </div>
      ) : null}

      {!selectedClass && isLoading ? (
        <p className="text-sm text-[#65736a] dark:text-[#c5c2ba]" role="status">
          Memuat statistik angkatan {year}…
        </p>
      ) : null}

      {!selectedClass && statistics.length ? (
        <section
          aria-label={`Statistik nilai angkatan ${year}`}
          className="grid gap-4 lg:grid-cols-2"
        >
          {statistics.map((item) => {
            const difference = item.semester2 - item.semester1
            const isImproving = difference >= 0
            const hasGrades = item.semester1 > 0 && item.semester2 > 0
            const cardContent = (
              <>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-[#26382e] dark:text-[#e8e5de]">
                      {item.className}
                    </h3>
                    <p className="mt-1 text-xs text-[#718078] dark:text-[#c5c2ba]">
                      Angkatan {year}
                    </p>
                  </div>
                  {hasGrades ? (
                    <span
                      className={
                        isImproving
                          ? 'rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200'
                          : 'rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-800 dark:bg-red-950/40 dark:text-red-200'
                      }
                    >
                      {isImproving ? 'Naik' : 'Turun'}{' '}
                      {Math.abs(difference).toFixed(1)}
                    </span>
                  ) : (
                    <span className="text-xs italic text-[#718078] dark:text-[#c5c2ba]">
                      Belum ada log nilai lengkap
                    </span>
                  )}
                </div>
                <div className="mt-5 space-y-3">
                  <ScoreBar
                    color="bg-[#ef9a37]"
                    label="Semester 1"
                    score={item.semester1}
                  />
                  <ScoreBar
                    color="bg-[#0f6a42] dark:bg-[#ffd166]"
                    label="Semester 2"
                    score={item.semester2}
                  />
                </div>
                <p className="mt-4 text-xs font-semibold text-[#0f5132] dark:text-[#ffd166]">
                  Pilih untuk pantau siswa
                </p>
              </>
            )

            return (
              <button
                className="rounded-2xl border border-[#e5ebe7] bg-white p-5 text-left shadow-sm transition hover:border-[#0f6a42] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f6a42] dark:border-[#616161] dark:bg-[#1c2d35] dark:hover:border-[#ffd166] dark:focus-visible:ring-[#ffd166]"
                key={item.className}
                onClick={() => {
                  if (role !== 'admin') {
                    setAccessDeniedOpen(true)
                    return
                  }
                  setSelectedClass(item.className)
                  setSelectedAdmissionYear(String(year))
                  setSelectedRole('semua')
                  setQuery('')
                  setFeedback(null)
                }}
                type="button"
              >
                {cardContent}
              </button>
            )
          })}
        </section>
      ) : !selectedClass && !statisticsError && !isLoading ? (
        <section className="rounded-2xl border border-dashed border-[#dce5df] bg-white px-5 py-12 text-center dark:border-[#616161] dark:bg-[#1c2d35]">
          <ChartNoAxesCombined
            aria-hidden="true"
            className="mx-auto text-[#8a9990] dark:text-[#d8d5cd]"
            size={28}
          />
          <h3 className="mt-3 text-sm font-semibold text-[#26382e] dark:text-[#e8e5de]">
            Belum ada data statistik
          </h3>
          <p className="mt-1 text-xs text-[#718078] dark:text-[#c5c2ba]">
            Belum ada nilai untuk angkatan {year}.
          </p>
        </section>
      ) : null}

      {role === 'admin' && selectedClass ? (
        <section className="overflow-hidden rounded-2xl border border-[#e5ebe7] bg-white shadow-sm dark:border-[#616161] dark:bg-[#1c2d35]">
          <div className="space-y-4 border-b border-[#e7ece8] p-5 dark:border-[#424242]">
            <div className="relative w-full">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#829087] dark:text-[#d8d5cd]"
                size={17}
              />
              <input
                aria-label="Cari nama atau nomor induk"
                className={`${fieldClassName} pl-10`}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Cari berdasarkan nama atau nomor induk..."
                type="search"
                value={query}
              />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div
                aria-label="Filter berdasarkan peran"
                className="flex flex-wrap gap-2"
                role="group"
              >
                {[
                  ['semua', 'Semua'],
                  ['guru_kelas', 'Guru Kelas'],
                  ['guru_mapel', 'Guru Mapel'],
                  ['siswa', 'Siswa'],
                ].map(([value, label]) => {
                  const isSelected = selectedRole === value
                  return (
                    <button
                      aria-pressed={isSelected}
                      className={
                        isSelected
                          ? 'min-h-9 rounded-full bg-[#0f5132] px-3 text-xs font-semibold text-white dark:bg-[#ffd166] dark:text-[#26382e]'
                          : 'min-h-9 rounded-full bg-[#edf0ed] px-3 text-xs font-semibold text-[#456052] dark:bg-[#34434b] dark:text-[#e8e5de]'
                      }
                      key={value}
                      onClick={() => setSelectedRole(value)}
                      type="button"
                    >
                      {label}
                    </button>
                  )
                })}
              </div>

              <label className="flex items-center gap-2">
                <span className="shrink-0 text-xs font-semibold text-[#718078] dark:text-[#c5c2ba]">
                  Angkatan
                </span>
                <select
                  aria-label="Filter berdasarkan angkatan"
                  className={`${fieldClassName} min-w-44`}
                  onChange={(event) =>
                    setSelectedAdmissionYear(event.target.value)
                  }
                  value={selectedAdmissionYear}
                >
                  {admissionYearOptions.map((option) => (
                    <option key={option} value={option}>
                      {option === 'Semua Angkatan'
                        ? option
                        : `Angkatan ${option}`}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          {initialRosterError ? (
            <p
              className="border-b border-amber-200 bg-amber-50 px-5 py-3 text-sm text-amber-900 dark:border-[#795d23] dark:bg-[#3b3020] dark:text-[#ffe0a3]"
              role="alert"
            >
              {initialRosterError}
            </p>
          ) : null}

          {visibleUsers.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] border-collapse text-left">
                <thead>
                  <tr className="bg-[#f7f9f7] text-[11px] font-semibold uppercase tracking-[0.08em] text-[#718078] dark:bg-[#111b21] dark:text-[#c5c2ba]">
                    <th className="px-5 py-3.5" scope="col">
                      Pengguna
                    </th>
                    <th className="px-5 py-3.5" scope="col">
                      Nomor induk
                    </th>
                    <th className="px-5 py-3.5" scope="col">
                      Keterangan
                    </th>
                    <th className="px-5 py-3.5" scope="col">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#edf0ed] dark:divide-[#424242]">
                  {visibleUsers.map((user) => {
                    const roleLabel =
                      user.role === 'siswa'
                        ? 'SISWA'
                        : user.jenis_guru === 'guru_kelas'
                          ? 'GURU KELAS'
                          : 'GURU MAPEL'
                    const description =
                      user.role === 'siswa'
                        ? `Angkatan ${user.tahun_angkatan ?? '—'} · Kelas ${user.kelas_nama ?? '—'}`
                        : user.jenis_guru === 'guru_mapel'
                          ? `Mengajar: ${user.kelas_mapel_nama.join(', ') || '—'}`
                          : `Mengajar: ${user.kelas_nama ?? '—'}`

                    return (
                      <tr key={user.id}>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#eaf3ed] text-xs font-bold text-[#0f5132] dark:bg-[#34434b] dark:text-[#ffd166]">
                              {user.nama_lengkap
                                .split(/\s+/)
                                .filter(Boolean)
                                .slice(0, 2)
                                .map((part) => part[0])
                                .join('')
                                .toUpperCase()}
                            </span>
                            <span className="text-sm font-semibold text-[#26382e] dark:text-[#e8e5de]">
                              {user.nama_lengkap}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-sm text-[#65736a] dark:text-[#c5c2ba]">
                          {user.nomor_induk}
                        </td>
                        <td className="px-5 py-4 text-sm text-[#65736a] dark:text-[#c5c2ba]">
                          <span className="block">{description}</span>
                          <span className="mt-1 inline-flex rounded-full bg-[#eaf3ed] px-2 py-0.5 text-[10px] font-semibold text-[#0f5132] dark:bg-[#34434b] dark:text-[#e8e5de]">
                            {roleLabel}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          {user.is_deleted === 0 ? (
                            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                              Aktif
                            </span>
                          ) : (
                            <span className="text-xs font-semibold text-red-700 dark:text-red-300">
                              Nonaktif
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-5 py-12 text-center">
              <UsersRound
                aria-hidden="true"
                className="mx-auto text-[#8a9990] dark:text-[#d8d5cd]"
                size={27}
              />
              <p className="mt-3 text-sm font-semibold text-[#26382e] dark:text-[#e8e5de]">
                Data tidak ditemukan.
              </p>
              {query ? (
                <p className="mt-1 text-xs text-[#718078] dark:text-[#c5c2ba]">
                  Coba ubah kata kunci atau filter.
                </p>
              ) : null}
            </div>
          )}
        </section>
      ) : null}

      {promotionOpen ? (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"
          onClick={(event) => {
            if (event.target === event.currentTarget && !isPromoting) {
              setPromotionOpen(false)
            }
          }}
        >
          <section
            aria-labelledby="promote-students-title"
            aria-modal="true"
            className="w-full max-w-lg rounded-2xl border border-[#e5ebe7] bg-white p-6 shadow-2xl dark:border-[#616161] dark:bg-[#1c2d35]"
            role="alertdialog"
          >
            <div className="flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-full bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300">
                <AlertTriangle aria-hidden="true" size={22} />
              </span>
              <h2
                className="text-lg font-bold text-[#26382e] dark:text-[#e8e5de]"
                id="promote-students-title"
              >
                Konfirmasi kenaikan kelas massal
              </h2>
            </div>
            <p className="mt-4 text-sm leading-6 text-[#65736a] dark:text-[#c5c2ba]">
              Tindakan ini berlaku untuk seluruh siswa aktif di kelas 1–6:
              siswa kelas 1–5 naik satu tingkat, siswa kelas 6 dipindahkan ke
              Alumni, dan riwayat nilai tetap tersimpan. Proses tidak dapat
              dibatalkan secara manual.
            </p>
            <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs leading-5 text-red-900 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200">
              Server juga mensyaratkan tepat satu kelas aktif untuk tiap tingkat
              1–6. Jangan jalankan proses ini jika tahun ajaran belum selesai.
            </p>
            <label className="mt-4 flex cursor-pointer items-start gap-3 text-sm leading-5 text-[#35463b] dark:text-[#e8e5de]">
              <input
                checked={acknowledged}
                className="mt-0.5 size-4 accent-[#0f5132]"
                disabled={isPromoting}
                onChange={(event) => setAcknowledged(event.target.checked)}
                type="checkbox"
              />
              Saya memahami bahwa semua siswa kelas 1–6 akan diproses.
            </label>
            <div className="mt-6 flex justify-end gap-3">
              <button
                className="min-h-10 rounded-xl border border-[#dce5df] px-4 text-sm font-semibold text-[#456052] disabled:cursor-not-allowed disabled:opacity-60 dark:border-[#616161] dark:text-[#e8e5de]"
                disabled={isPromoting}
                onClick={() => setPromotionOpen(false)}
                type="button"
              >
                Batal
              </button>
              <button
                className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#a52d2d] px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                disabled={!acknowledged || isPromoting}
                onClick={() => void confirmPromotion()}
                type="button"
              >
                <Bolt aria-hidden="true" size={15} />
                {isPromoting ? 'Memproses…' : 'Ya, naikkan kelas'}
              </button>
            </div>
          </section>
        </div>
      ) : null}

      {accessDeniedOpen ? (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setAccessDeniedOpen(false)
            }
          }}
        >
          <section
            aria-labelledby="statistics-access-denied-title"
            aria-modal="true"
            className="w-full max-w-md rounded-2xl border border-[#e5ebe7] bg-white p-6 shadow-2xl dark:border-[#616161] dark:bg-[#1c2d35]"
            role="alertdialog"
          >
            <h2
              className="text-lg font-bold text-[#26382e] dark:text-[#e8e5de]"
              id="statistics-access-denied-title"
            >
              Akses terbatas
            </h2>
            <p className="mt-3 text-sm leading-6 text-[#65736a] dark:text-[#c5c2ba]">
              Pantau Semua Data dan kenaikan kelas massal hanya dapat dibuka
              oleh admin. Anda tetap dapat melihat statistik kelas yang menjadi
              hak akses Anda.
            </p>
            <div className="mt-6 flex justify-end">
              <button
                className="min-h-10 rounded-xl bg-[#0f5132] px-4 text-sm font-semibold text-white dark:bg-[#ffd166] dark:text-[#26382e]"
                onClick={() => setAccessDeniedOpen(false)}
                type="button"
              >
                Mengerti
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  )
}

function ScoreBar({
  color,
  label,
  score,
}: {
  color: string
  label: string
  score: number
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-xs">
        <span className="text-[#65736a] dark:text-[#c5c2ba]">{label}</span>
        <span className="font-bold text-[#26382e] dark:text-[#e8e5de]">
          {score.toFixed(1)}
        </span>
      </div>
      <div
        aria-label={`${label}: ${score.toFixed(1)} dari 100`}
        className="h-2.5 overflow-hidden rounded-full bg-[#edf0ed] dark:bg-[#424242]"
        role="img"
      >
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  )
}
