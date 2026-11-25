'use client'

import Link from 'next/link'
import { useMemo, useRef, useState, type FormEvent } from 'react'
import {
  BookOpen,
  CalendarDays,
  Clock3,
  MapPin,
  Pencil,
  Plus,
  Trash2,
  UserRound,
} from 'lucide-react'

import type {
  AssignmentClass,
  ClassSubjectAssignment,
} from '@/lib/services/assignments/assignment-service'
import {
  deleteAdminSchedule,
  fetchAdminSchedule,
  saveAdminSchedule,
} from '@/lib/services/schedules/schedule-mutation-service'
import {
  scheduleDays,
  type ScheduleDay,
  type SchoolSchedule,
} from '@/lib/services/schedules/schedule-types'

type ScheduleManagementProps = {
  classes: AssignmentClass[]
  assignments: ClassSubjectAssignment[]
  initialClassId: number | null
  initialDay: ScheduleDay
  initialSchedules: SchoolSchedule[]
  initialScheduleError: string | null
}

type Feedback = {
  status: 'success' | 'error'
  message: string
}

const fieldClassName =
  'min-h-11 w-full rounded-xl border border-[#dce5df] bg-white px-3.5 text-sm text-[#26382e] outline-none transition focus:border-[#0f5132] focus:ring-2 focus:ring-[#0f5132]/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-[#616161] dark:bg-[#111b21] dark:text-[#e8e5de] dark:focus:border-[#ffd166] dark:focus:ring-[#ffd166]/10'

const labelClassName =
  'mb-1.5 block text-xs font-semibold text-[#35463b] dark:text-[#e8e5de]'

function isTimeValue(value: string) {
  if (!/^\d{2}:\d{2}$/.test(value)) return false
  const [hours, minutes] = value.split(':').map(Number)
  return hours <= 23 && minutes <= 59
}

export default function ScheduleManagement({
  classes,
  assignments,
  initialClassId,
  initialDay,
  initialSchedules,
  initialScheduleError,
}: ScheduleManagementProps) {
  const formRef = useRef<HTMLFormElement>(null)
  const requestId = useRef(0)
  const [classId, setClassId] = useState(
    initialClassId === null ? '' : String(initialClassId),
  )
  const [day, setDay] = useState<ScheduleDay>(initialDay)
  const [schedules, setSchedules] = useState(initialSchedules)
  const [scheduleError, setScheduleError] = useState(initialScheduleError)
  const [isLoading, setIsLoading] = useState(false)
  const [assignmentId, setAssignmentId] = useState('')
  const [editId, setEditId] = useState<number | null>(null)
  const [startTime, setStartTime] = useState('07:00')
  const [endTime, setEndTime] = useState('08:30')
  const [room, setRoom] = useState('Ruang Kelas')
  const [isSaving, setIsSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [pendingDelete, setPendingDelete] = useState<SchoolSchedule | null>(
    null,
  )
  const [feedback, setFeedback] = useState<Feedback | null>(null)

  const selectedClassId = Number(classId)
  const classAssignments = useMemo(
    () =>
      assignments.filter(
        (assignment) => assignment.kelas_id === selectedClassId,
      ),
    [assignments, selectedClassId],
  )
  const selectedClassName =
    classes.find((schoolClass) => schoolClass.id === selectedClassId)?.nama ??
    ''

  function resetForm() {
    setEditId(null)
    setAssignmentId('')
    setStartTime('07:00')
    setEndTime('08:30')
    setRoom('Ruang Kelas')
  }

  async function loadSchedules(nextClassId: string, nextDay: ScheduleDay) {
    const request = ++requestId.current
    const numericClassId = Number(nextClassId)

    if (!nextClassId || !Number.isSafeInteger(numericClassId)) {
      setSchedules([])
      setScheduleError(null)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setScheduleError(null)
    const result = await fetchAdminSchedule(numericClassId, nextDay)

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

  function handleClassChange(value: string) {
    setClassId(value)
    resetForm()
    setFeedback(null)
    void loadSchedules(value, day)
  }

  function handleDayChange(value: ScheduleDay) {
    setDay(value)
    resetForm()
    setFeedback(null)
    void loadSchedules(classId, value)
  }

  function beginEdit(schedule: SchoolSchedule) {
    setEditId(schedule.id)
    setAssignmentId(String(schedule.kelas_mapel_id))
    setStartTime(schedule.jam_mulai_format)
    setEndTime(schedule.jam_selesai_format)
    setRoom(schedule.ruangan ?? '')
    setFeedback(null)
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isSaving) return

    if (!classId || !assignmentId) {
      setFeedback({
        status: 'error',
        message: 'Pilih kelas dan penugasan mapel yang sesuai.',
      })
      return
    }
    if (!isTimeValue(startTime) || !isTimeValue(endTime)) {
      setFeedback({
        status: 'error',
        message: 'Masukkan waktu mulai dan selesai yang valid.',
      })
      return
    }
    if (endTime <= startTime) {
      setFeedback({
        status: 'error',
        message: 'Jam selesai harus setelah jam mulai.',
      })
      return
    }
    if (!room.trim() || room.trim().length > 50) {
      setFeedback({
        status: 'error',
        message: 'Ruangan wajib diisi dan maksimal 50 karakter.',
      })
      return
    }

    setIsSaving(true)
    setFeedback(null)
    const result = await saveAdminSchedule({
      id: editId,
      assignmentId: Number(assignmentId),
      day,
      startTime,
      endTime,
      room,
    })

    if (result.status === 'success') {
      resetForm()
      setFeedback(result)
      await loadSchedules(classId, day)
    } else {
      setFeedback(result)
    }
    setIsSaving(false)
  }

  async function confirmDelete() {
    if (!pendingDelete || deletingId !== null) return

    const schedule = pendingDelete
    setDeletingId(schedule.id)
    setFeedback(null)
    const result = await deleteAdminSchedule(schedule.id)
    setPendingDelete(null)

    if (result.status === 'success') {
      if (editId === schedule.id) resetForm()
      setFeedback(result)
      await loadSchedules(classId, day)
    } else {
      setFeedback(result)
    }
    setDeletingId(null)
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#0f6a42] dark:text-[#ffd166]">
            Administrasi akademik
          </p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-[#1d2b23] dark:text-[#e8e5de]">
            Jadwal Pelajaran
          </h2>
          <p className="mt-2 text-sm leading-6 text-[#65736a] dark:text-[#c5c2ba]">
            Atur slot pelajaran per kelas dan hari berdasarkan penugasan aktif.
          </p>
        </div>
      </header>

      <section className="rounded-2xl border border-[#e5ebe7] bg-white p-5 shadow-sm dark:border-[#616161] dark:bg-[#1c2d35] sm:p-6">
        <div className="mb-5">
          <h3 className="text-sm font-bold text-[#26382e] dark:text-[#e8e5de]">
            Filter jadwal
          </h3>
          <p className="mt-1 text-xs text-[#718078] dark:text-[#c5c2ba]">
            Pilih kelas dan hari untuk melihat slot yang sudah diatur.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClassName} htmlFor="schedule-class">
              Tingkat kelas
            </label>
            <select
              className={fieldClassName}
              disabled={!classes.length}
              id="schedule-class"
              onChange={(event) => handleClassChange(event.target.value)}
              value={classId}
            >
              <option value="">Pilih kelas</option>
              {classes.map((schoolClass) => (
                <option key={schoolClass.id} value={schoolClass.id}>
                  {schoolClass.nama}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClassName} htmlFor="schedule-day">
              Hari belajar
            </label>
            <select
              className={fieldClassName}
              id="schedule-day"
              onChange={(event) =>
                handleDayChange(event.target.value as ScheduleDay)
              }
              value={day}
            >
              {scheduleDays.map((scheduleDay) => (
                <option key={scheduleDay} value={scheduleDay}>
                  {scheduleDay}
                </option>
              ))}
            </select>
          </div>
        </div>
        {!classes.length ? (
          <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-xs leading-5 text-amber-900 dark:border-[#795d23] dark:bg-[#3b3020] dark:text-[#ffe0a3]">
            Belum ada kelas aktif untuk dijadwalkan.
          </p>
        ) : null}
      </section>

      <section
        className="grid scroll-mt-24 gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]"
        ref={formRef}
      >
        <form
          className="h-fit rounded-2xl border border-[#e5ebe7] bg-white p-5 shadow-sm dark:border-[#616161] dark:bg-[#1c2d35] sm:p-6"
          onSubmit={handleSubmit}
        >
          <div className="mb-5 flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-[#eaf3ed] text-[#0f5132] dark:bg-[#34434b] dark:text-[#ffd166]">
              {editId === null ? (
                <Plus aria-hidden="true" size={19} />
              ) : (
                <Pencil aria-hidden="true" size={18} />
              )}
            </span>
            <div>
              <h3 className="text-sm font-bold text-[#26382e] dark:text-[#e8e5de]">
                {editId === null ? 'Tambah slot jadwal baru' : 'Edit jadwal'}
              </h3>
              <p className="mt-0.5 text-xs text-[#718078] dark:text-[#c5c2ba]">
                {selectedClassName || 'Pilih kelas'} · {day}
              </p>
            </div>
          </div>

          <label
            className={labelClassName}
            htmlFor="schedule-assignment"
          >
            Mapel dan guru pengampu
          </label>
          <select
            className={fieldClassName}
            disabled={!classId || classAssignments.length === 0}
            id="schedule-assignment"
            onChange={(event) => setAssignmentId(event.target.value)}
            required
            value={assignmentId}
          >
            <option value="">Pilih penugasan mapel</option>
            {classAssignments.map((assignment) => (
              <option key={assignment.id} value={assignment.id}>
                {assignment.mata_pelajaran} — {assignment.guru_pengampu} (
                {assignment.tahun_ajaran})
              </option>
            ))}
          </select>
          {classId && classAssignments.length === 0 ? (
            <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-xs leading-5 text-amber-900 dark:border-[#795d23] dark:bg-[#3b3020] dark:text-[#ffe0a3]">
              <p>
                Belum ada penugasan mapel aktif untuk {selectedClassName}.
                Tambahkan penugasan terlebih dahulu.
              </p>
              <Link
                className="mt-2 inline-flex font-semibold underline underline-offset-2"
                href="/academics/teaching-assignments"
              >
                Buka Penugasan Mapel
              </Link>
            </div>
          ) : null}

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClassName} htmlFor="schedule-start">
                Jam mulai
              </label>
              <input
                className={fieldClassName}
                id="schedule-start"
                onChange={(event) => setStartTime(event.target.value)}
                required
                type="time"
                value={startTime}
              />
            </div>
            <div>
              <label className={labelClassName} htmlFor="schedule-end">
                Jam selesai
              </label>
              <input
                className={fieldClassName}
                id="schedule-end"
                onChange={(event) => setEndTime(event.target.value)}
                required
                type="time"
                value={endTime}
              />
            </div>
          </div>

          <label className={`${labelClassName} mt-4`} htmlFor="schedule-room">
            Lokasi ruangan / kelas
          </label>
          <input
            className={fieldClassName}
            id="schedule-room"
            maxLength={50}
            onChange={(event) => setRoom(event.target.value)}
            placeholder="Contoh: Ruang Kelas"
            required
            value={room}
          />

          <p className="mt-2 text-xs leading-5 text-[#718078] dark:text-[#c5c2ba]">
            Jadwal yang bertabrakan dengan kelas atau jam mengajar guru akan
            ditolak.
          </p>

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

          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <button
              className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-[#0f5132] px-4 text-sm font-bold text-white transition hover:bg-[#0b4229] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[#ffd166] dark:text-[#172027] dark:hover:bg-[#ffdc85]"
              disabled={
                isSaving ||
                !classId ||
                classAssignments.length === 0 ||
                !assignmentId
              }
              type="submit"
            >
              {editId === null ? (
                <Plus aria-hidden="true" size={17} />
              ) : (
                <Pencil aria-hidden="true" size={16} />
              )}
              {isSaving
                ? 'Menyimpan…'
                : editId === null
                  ? 'Simpan slot jadwal'
                  : 'Simpan perubahan'}
            </button>
            {editId !== null ? (
              <button
                className="min-h-11 rounded-xl border border-[#dce5df] px-4 text-sm font-semibold text-[#456052] dark:border-[#616161] dark:text-[#e8e5de]"
                onClick={resetForm}
                type="button"
              >
                Batal edit
              </button>
            ) : null}
          </div>
        </form>

        <section className="overflow-hidden rounded-2xl border border-[#e5ebe7] bg-white shadow-sm dark:border-[#616161] dark:bg-[#1c2d35]">
          <div className="border-b border-[#e7ece8] p-4 dark:border-[#424242] sm:px-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-[#26382e] dark:text-[#e8e5de]">
                  Tinjauan Jadwal {selectedClassName}
                </h3>
                <p className="mt-1 text-xs text-[#718078] dark:text-[#c5c2ba]">
                  {day} · {schedules.length.toLocaleString('id-ID')} slot
                </p>
              </div>
              <CalendarDays
                aria-hidden="true"
                className="mt-0.5 text-[#0f5132] dark:text-[#ffd166]"
                size={19}
              />
            </div>
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
            <div className="px-5 py-12 text-center">
              <p
                className="text-sm leading-6 text-[#9c2c2c] dark:text-[#ffc5c5]"
                role="alert"
              >
                {scheduleError}
              </p>
              <button
                className="mt-4 min-h-10 rounded-xl bg-[#0f5132] px-4 text-xs font-semibold text-white dark:bg-[#ffd166] dark:text-[#172027]"
                onClick={() => void loadSchedules(classId, day)}
                type="button"
              >
                Coba lagi
              </button>
            </div>
          ) : !classId ? (
            <div className="px-5 py-12 text-center text-sm text-[#718078] dark:text-[#c5c2ba]">
              Pilih kelas untuk melihat jadwal.
            </div>
          ) : schedules.length ? (
            <ul className="divide-y divide-[#edf0ed] dark:divide-[#424242]">
              {schedules.map((schedule) => (
                <li className="p-4 sm:p-5" key={schedule.id}>
                  <div className="flex items-start gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#eaf3ed] text-[#0f5132] dark:bg-[#34434b] dark:text-[#ffd166]">
                      <BookOpen aria-hidden="true" size={18} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <h4 className="text-sm font-semibold text-[#26382e] dark:text-[#e8e5de]">
                            {schedule.mata_pelajaran}
                          </h4>
                          <p className="mt-1 text-xs text-[#65736a] dark:text-[#c5c2ba]">
                            Guru: {schedule.guru_pengampu}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <button
                            aria-label={`Edit jadwal ${schedule.mata_pelajaran}`}
                            className="grid size-9 place-items-center rounded-lg text-[#456052] transition hover:bg-[#eaf3ed] dark:text-[#e8e5de] dark:hover:bg-[#34434b]"
                            onClick={() => beginEdit(schedule)}
                            type="button"
                          >
                            <Pencil aria-hidden="true" size={16} />
                          </button>
                          <button
                            aria-label={`Hapus jadwal ${schedule.mata_pelajaran}`}
                            className="grid size-9 place-items-center rounded-lg text-[#9c2c2c] transition hover:bg-[#fff0f0] dark:text-[#ffc5c5] dark:hover:bg-[#351d22]"
                            onClick={() => setPendingDelete(schedule)}
                            type="button"
                          >
                            <Trash2 aria-hidden="true" size={16} />
                          </button>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-[#718078] dark:text-[#c5c2ba]">
                        <span className="inline-flex items-center gap-1.5">
                          <Clock3 aria-hidden="true" size={14} />
                          {schedule.jam_mulai_format}–{schedule.jam_selesai_format}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <MapPin aria-hidden="true" size={14} />
                          {schedule.ruangan ?? 'Ruang Kelas'}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <UserRound aria-hidden="true" size={14} />
                          Tahun ajaran {schedule.tahun_ajaran}
                        </span>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-5 py-12 text-center">
              <CalendarDays
                aria-hidden="true"
                className="mx-auto text-[#8a9990] dark:text-[#d8d5cd]"
                size={27}
              />
              <p className="mt-3 text-sm font-semibold text-[#26382e] dark:text-[#e8e5de]">
                Belum ada slot pelajaran
              </p>
              <p className="mt-1 text-xs text-[#718078] dark:text-[#c5c2ba]">
                Tambahkan slot jadwal untuk {selectedClassName} pada hari {day}.
              </p>
            </div>
          )}
        </section>
      </section>

      {pendingDelete ? (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"
          onClick={(event) => {
            if (event.target === event.currentTarget && deletingId === null) {
              setPendingDelete(null)
            }
          }}
        >
          <section
            aria-labelledby="delete-schedule-title"
            aria-modal="true"
            className="w-full max-w-md rounded-2xl border border-[#e5ebe7] bg-white p-6 shadow-2xl dark:border-[#616161] dark:bg-[#1c2d35]"
            role="alertdialog"
          >
            <h2
              className="text-lg font-bold text-[#26382e] dark:text-[#e8e5de]"
              id="delete-schedule-title"
            >
              Hapus jadwal?
            </h2>
            <p className="mt-3 text-sm leading-6 text-[#65736a] dark:text-[#c5c2ba]">
              Jadwal {pendingDelete.mata_pelajaran} untuk {selectedClassName}{' '}
              pada hari {pendingDelete.hari} akan dihapus.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                className="min-h-10 rounded-xl border border-[#dce5df] px-4 text-sm font-semibold text-[#456052] disabled:opacity-60 dark:border-[#616161] dark:text-[#e8e5de]"
                disabled={deletingId !== null}
                onClick={() => setPendingDelete(null)}
                type="button"
              >
                Batal
              </button>
              <button
                className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#a52d2d] px-4 text-sm font-semibold text-white disabled:opacity-60"
                disabled={deletingId !== null}
                onClick={() => void confirmDelete()}
                type="button"
              >
                <Trash2 aria-hidden="true" size={15} />
                {deletingId === pendingDelete.id ? 'Menghapus…' : 'Hapus'}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  )
}
