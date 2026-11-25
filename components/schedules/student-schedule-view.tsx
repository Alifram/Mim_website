'use client'

import { useRef, useState } from 'react'
import {
  BookOpen,
  CalendarDays,
  Clock3,
  MapPin,
  UserRound,
} from 'lucide-react'

import { fetchMySchedule } from '@/lib/services/schedules/schedule-mutation-service'
import {
  scheduleDays,
  type ScheduleDay,
  type SchoolSchedule,
} from '@/lib/services/schedules/schedule-types'

type StudentScheduleViewProps = {
  currentDay: ScheduleDay
  initialDay: ScheduleDay
  initialScheduleError: string | null
  initialSchedules: SchoolSchedule[]
  studentName: string
  studentNumber: string
}

export default function StudentScheduleView({
  currentDay,
  initialDay,
  initialScheduleError,
  initialSchedules,
  studentName,
  studentNumber,
}: StudentScheduleViewProps) {
  const requestId = useRef(0)
  const [day, setDay] = useState(initialDay)
  const [schedules, setSchedules] = useState(initialSchedules)
  const [scheduleError, setScheduleError] = useState(initialScheduleError)
  const [isLoading, setIsLoading] = useState(false)

  async function loadSchedules(nextDay: ScheduleDay) {
    const request = ++requestId.current
    setIsLoading(true)
    setScheduleError(null)

    const result = await fetchMySchedule(nextDay)
    if (request !== requestId.current) return

    if (result.status === 'success') {
      setSchedules(result.schedules)
      setScheduleError(null)
    } else {
      setSchedules([])
      setScheduleError(result.message)
    }
    setIsLoading(false)
  }

  function handleDayChange(nextDay: ScheduleDay) {
    if (nextDay === day) return
    setDay(nextDay)
    void loadSchedules(nextDay)
  }

  return (
    <div className="space-y-5">
      <section className="rounded-2xl bg-gradient-to-br from-[#0f5132] to-[#24734b] p-5 text-white shadow-sm sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-white/70">
              Jadwal Siswa
            </p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight">
              Jadwal Pelajaran
            </h2>
            <p className="mt-2 text-sm text-white/85">
              {studentName} <span className="text-white/60">·</span>{' '}
              {studentNumber}
            </p>
            <p className="mt-1 text-xs text-white/70">
              Jadwal kelas Anda untuk tahun ajaran aktif.
            </p>
          </div>
        </div>
      </section>

      <nav
        aria-label="Pilih hari jadwal"
        className="flex gap-2 overflow-x-auto rounded-2xl border border-[#e5ebe7] bg-white p-2 dark:border-[#616161] dark:bg-[#1c2d35]"
      >
        {scheduleDays.map((scheduleDay) => (
          <button
            aria-pressed={day === scheduleDay}
            className={`relative min-h-10 shrink-0 rounded-xl px-4 text-sm font-semibold transition ${
              day === scheduleDay
                ? 'bg-[#0f5132] text-white dark:bg-[#ffd166] dark:text-[#202a24]'
                : 'text-[#65736a] hover:bg-[#f3f7f4] dark:text-[#c5c2ba] dark:hover:bg-[#26343b]'
            }`}
            key={scheduleDay}
            onClick={() => handleDayChange(scheduleDay)}
            type="button"
          >
            {scheduleDay}
            {scheduleDay === currentDay ? (
              <span className="ml-1.5 text-[10px] font-medium opacity-75">
                Hari ini
              </span>
            ) : null}
          </button>
        ))}
      </nav>

      <section className="overflow-hidden rounded-2xl border border-[#e5ebe7] bg-white shadow-sm dark:border-[#616161] dark:bg-[#1c2d35]">
        <div className="flex items-center justify-between gap-3 border-b border-[#e5ebe7] px-4 py-4 dark:border-[#616161] sm:px-5">
          <div>
            <h3 className="font-bold text-[#26382e] dark:text-[#e8e5de]">
              Pelajaran Hari {day}
            </h3>
            <p className="mt-1 text-xs text-[#718078] dark:text-[#c5c2ba]">
              {schedules.length.toLocaleString('id-ID')} mata pelajaran
            </p>
          </div>
          <CalendarDays
            aria-hidden="true"
            className="shrink-0 text-[#0f5132] dark:text-[#ffd166]"
            size={20}
          />
        </div>

        {isLoading ? (
          <div className="px-5 py-12 text-center">
            <div
              aria-label="Memuat jadwal"
              className="mx-auto size-6 animate-spin rounded-full border-2 border-[#dce5df] border-t-[#0f5132] dark:border-[#424242] dark:border-t-[#ffd166]"
              role="status"
            />
            <p className="mt-3 text-xs text-[#718078] dark:text-[#c5c2ba]">
              Memuat jadwal…
            </p>
          </div>
        ) : scheduleError ? (
          <div className="px-5 py-10 text-center">
            <p
              className="text-sm leading-6 text-red-800 dark:text-red-200"
              role="alert"
            >
              {scheduleError}
            </p>
            <button
              className="mt-4 min-h-10 rounded-xl bg-[#0f5132] px-4 text-xs font-semibold text-white dark:bg-[#ffd166] dark:text-[#172027]"
              onClick={() => void loadSchedules(day)}
              type="button"
            >
              Coba lagi
            </button>
          </div>
        ) : schedules.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <CalendarDays
              aria-hidden="true"
              className="mx-auto text-[#8a9990] dark:text-[#d8d5cd]"
              size={28}
            />
            <p className="mt-3 text-sm font-semibold text-[#26382e] dark:text-[#e8e5de]">
              Tidak ada pelajaran hari {day}
            </p>
            <p className="mt-1 text-xs text-[#718078] dark:text-[#c5c2ba]">
              Jadwal kelas akan muncul di sini jika tersedia.
            </p>
          </div>
        ) : (
          <ol className="divide-y divide-[#edf0ed] dark:divide-[#424242]">
            {schedules.map((schedule, index) => (
              <li className="p-4 sm:p-5" key={schedule.id}>
                <article className="flex items-start gap-3 sm:gap-4">
                  <div className="w-[82px] shrink-0 pt-0.5">
                    <p className="text-sm font-bold text-[#26382e] dark:text-[#e8e5de]">
                      {schedule.jam_mulai_format}
                    </p>
                    <p className="mt-0.5 text-xs text-[#718078] dark:text-[#c5c2ba]">
                      s/d {schedule.jam_selesai_format}
                    </p>
                    <span className="mt-2 inline-flex max-w-full items-center gap-1 rounded-md bg-[#eaf3ed] px-2 py-1 text-[11px] font-semibold text-[#0f5132] dark:bg-[#263a32] dark:text-[#d4f0dc]">
                      <MapPin aria-hidden="true" size={12} />
                      <span className="truncate">
                        {schedule.ruangan ?? 'Kelas'}
                      </span>
                    </span>
                  </div>

                  <span
                    aria-hidden="true"
                    className="mt-0.5 h-[76px] w-1 shrink-0 rounded-full bg-[#0f5132]/60 dark:bg-[#ffd166]/70"
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start gap-2">
                      <BookOpen
                        aria-hidden="true"
                        className="mt-0.5 shrink-0 text-[#0f5132] dark:text-[#ffd166]"
                        size={17}
                      />
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-bold text-[#26382e] dark:text-[#e8e5de]">
                            {schedule.mata_pelajaran}
                          </h4>
                          <span className="rounded-full bg-[#f2f5f2] px-2 py-0.5 text-[10px] font-semibold text-[#65736a] dark:bg-[#26343b] dark:text-[#c5c2ba]">
                            Pelajaran {index + 1}
                          </span>
                        </div>
                        <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-[#65736a] dark:text-[#c5c2ba]">
                          <UserRound aria-hidden="true" size={13} />
                          Guru: {schedule.guru_pengampu}
                        </p>
                        <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-[#718078] dark:text-[#c5c2ba]">
                          <Clock3 aria-hidden="true" size={13} />
                          Tahun ajaran {schedule.tahun_ajaran}
                        </p>
                      </div>
                    </div>
                  </div>
                </article>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  )
}
