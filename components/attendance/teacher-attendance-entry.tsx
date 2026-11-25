'use client'

import { useMemo, useState, type FormEvent } from 'react'
import {
  CalendarDays,
  Check,
  ClipboardCheck,
  Heart,
  Save,
  UserRound,
  X,
} from 'lucide-react'

import {
  fetchTeacherAttendanceData,
  saveTeacherAttendance,
} from '@/lib/services/attendance/attendance-query-service'
import {
  attendanceStatuses,
  type AttendanceHistory,
  type AttendanceStatus,
  type AttendanceStudent,
} from '@/lib/services/attendance/attendance-types'

type TeacherAttendanceEntryProps = {
  classId: number
  className: string
  date: string
  initialHistory: AttendanceHistory
  initialStudents: AttendanceStudent[]
  teacherName: string
}

type StudentEntry = {
  student: AttendanceStudent
  status: AttendanceStatus
  note: string
}

type Feedback = {
  status: 'success' | 'error'
  message: string
}

const statusStyles: Record<AttendanceStatus, string> = {
  Hadir:
    'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200',
  Sakit:
    'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200',
  Izin:
    'border-amber-200 bg-amber-50 text-amber-900 dark:border-[#795d23] dark:bg-[#3b3020] dark:text-[#ffe0a3]',
  Alpa:
    'border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200',
}

const statusIcons = {
  Hadir: Check,
  Sakit: Heart,
  Izin: ClipboardCheck,
  Alpa: X,
} satisfies Record<AttendanceStatus, typeof Check>

const inputClassName =
  'min-h-11 w-full rounded-xl border border-[#dce5df] bg-white px-3.5 text-sm text-[#26382e] outline-none transition placeholder:text-[#94a198] focus:border-[#0f5132] focus:ring-2 focus:ring-[#0f5132]/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-[#616161] dark:bg-[#111b21] dark:text-[#e8e5de] dark:placeholder:text-[#9b9891] dark:focus:border-[#ffd166] dark:focus:ring-[#ffd166]/10'

function createEntries(
  students: AttendanceStudent[],
  history: AttendanceHistory,
): StudentEntry[] {
  const previousEntries = new Map(
    history.records.map((record) => [record.siswa_id, record]),
  )

  return students.map((student) => {
    const previous = previousEntries.get(student.id)
    return {
      student,
      status: previous?.status ?? 'Hadir',
      note: previous?.catatan ?? '',
    }
  })
}

function formatAttendanceDate(date: string) {
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'full',
    timeZone: 'UTC',
  }).format(new Date(`${date}T00:00:00Z`))
}

export default function TeacherAttendanceEntry({
  classId,
  className,
  date,
  initialHistory,
  initialStudents,
  teacherName,
}: TeacherAttendanceEntryProps) {
  const [entries, setEntries] = useState(() =>
    createEntries(initialStudents, initialHistory),
  )
  const [savedEntries, setSavedEntries] = useState(() =>
    createEntries(initialStudents, initialHistory),
  )
  const [isSaving, setIsSaving] = useState(false)
  const [rosterError, setRosterError] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<Feedback | null>(null)

  const counts = useMemo(
    () =>
      attendanceStatuses.reduce(
        (result, status) => {
          result[status] = entries.filter((entry) => entry.status === status).length
          return result
        },
        { Hadir: 0, Sakit: 0, Izin: 0, Alpa: 0 },
      ),
    [entries],
  )
  const hasUnsavedChanges = useMemo(() => {
    const savedByStudent = new Map(
      savedEntries.map((entry) => [entry.student.id, entry]),
    )
    return entries.some((entry) => {
      const saved = savedByStudent.get(entry.student.id)
      return !saved || saved.status !== entry.status || saved.note !== entry.note
    })
  }, [entries, savedEntries])

  function updateEntry(studentId: number, update: Partial<StudentEntry>) {
    setEntries((currentEntries) =>
      currentEntries.map((entry) =>
        entry.student.id === studentId ? { ...entry, ...update } : entry,
      ),
    )
    setFeedback(null)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (entries.length === 0 || rosterError) return

    setIsSaving(true)
    setFeedback(null)
    const result = await saveTeacherAttendance(
      date,
      classId,
      entries.map((entry) => ({
        siswa_id: entry.student.id,
        status: entry.status,
        catatan: entry.note.trim(),
      })),
    )

    if (result.status === 'error') {
      setFeedback({ status: 'error', message: result.message })
      setIsSaving(false)
      return
    }

    setSavedEntries(entries)
    setFeedback({
      status: 'success',
      message: `Presensi ${className} berhasil disimpan.`,
    })
    const reloadResult = await fetchTeacherAttendanceData(date, classId)
    if (reloadResult.status === 'success') {
      const refreshedEntries = createEntries(
        reloadResult.data.students,
        reloadResult.data.history,
      )
      setEntries(refreshedEntries)
      setSavedEntries(refreshedEntries)
      setRosterError(null)
    } else {
      setRosterError(reloadResult.message)
    }
    setIsSaving(false)
  }

  return (
    <div className="space-y-4">
      <section className="rounded-2xl bg-gradient-to-br from-[#0f5132] to-[#24734b] p-4 text-white shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-white/70">
              Presensi Harian
            </p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight">
              Presensi {className}
            </h2>
            <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-white/80">
              <CalendarDays aria-hidden="true" size={15} />
              <span>{formatAttendanceDate(date)}</span>
              <span aria-hidden="true">·</span>
              <span>Guru: {teacherName}</span>
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/15 pt-3">
          <div className="flex flex-wrap gap-2">
            {attendanceStatuses.map((status) => (
              <span
                className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-2.5 py-1.5 text-xs text-white/90"
                key={status}
              >
                {status}
                <strong className="text-sm text-white">{counts[status]}</strong>
              </span>
            ))}
          </div>
          <span className="text-sm font-semibold text-white/90">
            {entries.length} siswa
          </span>
        </div>
      </section>

      {rosterError ? (
        <p
          className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-[#795d23] dark:bg-[#3b3020] dark:text-[#ffe0a3]"
          role="alert"
        >
          {rosterError}
        </p>
      ) : null}

      {feedback ? (
        <p
          className={
            feedback.status === 'success'
              ? 'rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200'
              : 'rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200'
          }
          role={feedback.status === 'error' ? 'alert' : 'status'}
        >
          {feedback.message}
        </p>
      ) : null}

      <form
        className="space-y-3"
        onSubmit={(event) => void handleSubmit(event)}
      >
        <section className="overflow-hidden rounded-2xl border border-[#e5ebe7] bg-white shadow-sm dark:border-[#616161] dark:bg-[#1c2d35]">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#e5ebe7] px-4 py-3.5 dark:border-[#616161] sm:px-5">
            <div>
              <h3 className="font-bold text-[#26382e] dark:text-[#e8e5de]">
                Daftar siswa
              </h3>
              <p className="mt-1 text-xs leading-5 text-[#718078] dark:text-[#c5c2ba]">
                Pilih satu status per siswa. Status tersimpan akan muncul otomatis;
                presensi baru dimulai dari Hadir.
              </p>
            </div>
            {hasUnsavedChanges ? (
              <span
                className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-900 dark:bg-[#3b3020] dark:text-[#ffe0a3]"
                role="status"
              >
                Perubahan belum disimpan
              </span>
            ) : null}
          </div>

          {entries.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <UserRound
                aria-hidden="true"
                className="mx-auto text-[#718078] dark:text-[#c5c2ba]"
                size={28}
              />
              <p className="mt-3 text-sm font-semibold text-[#35463b] dark:text-[#e8e5de]">
                Belum ada siswa aktif di kelas ini
              </p>
              <p className="mt-1 text-xs text-[#718078] dark:text-[#c5c2ba]">
                Hubungi admin untuk memeriksa data kelas.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#e5ebe7] dark:divide-[#616161]">
              {entries.map((entry, index) => (
                <article
                  className="px-4 py-4 sm:px-5"
                  key={entry.student.id}
                >
                  <div className="grid gap-3 lg:grid-cols-[minmax(180px,1fr)_auto] lg:items-center">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#eef4ef] text-xs font-bold text-[#0f5132] dark:bg-[#263a32] dark:text-[#d4f0dc]">
                        {index + 1}
                      </span>
                      <div className="min-w-0">
                        <h4 className="truncate text-sm font-semibold text-[#26382e] dark:text-[#e8e5de]">
                          {entry.student.nama_lengkap}
                        </h4>
                        <p className="mt-0.5 text-xs text-[#718078] dark:text-[#c5c2ba]">
                          NIS: {entry.student.nomor_induk || '—'}
                        </p>
                      </div>
                    </div>

                    <div
                      aria-label={`Pilih satu status untuk ${entry.student.nama_lengkap}`}
                      className="w-full lg:w-auto"
                    >
                      <p className="mb-1.5 text-xs font-medium text-[#718078] dark:text-[#c5c2ba]">
                        Status kehadiran
                      </p>
                      <div className="grid grid-cols-2 gap-1.5 sm:flex sm:flex-wrap">
                        {attendanceStatuses.map((status) => {
                          const Icon = statusIcons[status]
                          const selected = entry.status === status
                          return (
                            <button
                              aria-pressed={selected}
                              className={`inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg border px-3 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                                selected
                                  ? statusStyles[status]
                                  : 'border-[#e5ebe7] bg-white text-[#65736a] hover:bg-[#f5f8f6] dark:border-[#616161] dark:bg-[#111b21] dark:text-[#c5c2ba] dark:hover:bg-[#26343b]'
                              }`}
                              disabled={isSaving || !!rosterError}
                              key={status}
                              onClick={() =>
                                updateEntry(entry.student.id, { status })
                              }
                              type="button"
                            >
                              <Icon aria-hidden="true" size={14} />
                              {status}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </div>

                  {entry.status === 'Sakit' || entry.status === 'Izin' ? (
                    <label className="mt-3 block lg:ml-auto lg:max-w-xl">
                      <span className="mb-1 block text-xs font-medium text-[#65736a] dark:text-[#c5c2ba]">
                        Catatan {entry.status.toLowerCase()} (opsional, maks. 200 karakter)
                      </span>
                      <input
                        className={inputClassName}
                        disabled={isSaving || !!rosterError}
                        maxLength={200}
                        onChange={(event) =>
                          updateEntry(entry.student.id, {
                            note: event.target.value,
                          })
                        }
                        placeholder="Tulis keterangan singkat"
                        value={entry.note}
                      />
                      <span className="mt-1 block text-right text-xs text-[#718078] dark:text-[#c5c2ba]">
                        {entry.note.length}/200
                      </span>
                    </label>
                  ) : null}
                </article>
              ))}
            </div>
          )}
        </section>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-[#718078] dark:text-[#c5c2ba]">
            Simpan akan mencatat status seluruh siswa sekaligus.
          </p>
          <button
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#0f5132] px-5 text-sm font-semibold text-white transition hover:bg-[#0b3f27] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[#ffd166] dark:text-[#202a24] dark:hover:bg-[#f2c45b]"
            disabled={entries.length === 0 || isSaving || !!rosterError}
            type="submit"
          >
            <Save aria-hidden="true" size={17} />
            {isSaving ? 'Menyimpan…' : 'Simpan Presensi'}
          </button>
        </div>
      </form>
    </div>
  )
}
