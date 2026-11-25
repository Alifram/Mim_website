'use client'

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from 'react'
import { useRouter } from 'next/navigation'
import { CalendarDays, Edit3, RefreshCw, Save, UserRound } from 'lucide-react'

import {
  fetchTeacherGradeAssignments,
  fetchTeacherGradeStudents,
  saveTeacherGrade,
} from '@/lib/services/grades/teacher-grade-query-service'
import type {
  GradeKind,
  GradeSemester,
  TeacherGradeAssignment,
  TeacherGradeStudent,
} from '@/lib/services/grades/teacher-grade-types'

type TeacherGradeEntryProps = {
  assignments: TeacherGradeAssignment[]
  defaultClassId: number | null
  initialAssignmentError: string | null
  initialDate: string
  initialStudents: TeacherGradeStudent[]
  initialStudentsError: string | null
  teacherName: string
}

type GradeTermOption = {
  value: string
  classId: number
  className: string
  semester: GradeSemester
}

type Feedback = {
  status: 'success' | 'error'
  message: string
}

const fieldClassName =
  'min-h-11 w-full rounded-xl border border-[#dce5df] bg-white px-3.5 text-sm text-[#26382e] outline-none transition focus:border-[#0f5132] focus:ring-2 focus:ring-[#0f5132]/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-[#616161] dark:bg-[#111b21] dark:text-[#e8e5de] dark:focus:border-[#ffd166] dark:focus:ring-[#ffd166]/10'

const labelClassName =
  'mb-1.5 block text-xs font-semibold text-[#35463b] dark:text-[#e8e5de]'

const gradeKindOptions: { value: GradeKind; label: string }[] = [
  { value: 'harian', label: 'Harian' },
  { value: 'uts', label: 'UTS' },
  { value: 'uas', label: 'UAS' },
]

function createTermOptions(
  assignments: TeacherGradeAssignment[],
): GradeTermOption[] {
  const classes = new Map<number, string>()
  for (const assignment of assignments) {
    classes.set(assignment.kelas_id, assignment.kelas)
  }

  const sortedClasses = Array.from(classes, ([classId, className]) => ({
    classId,
    className,
  })).sort((first, second) =>
    first.className.localeCompare(second.className, 'id', { numeric: true }),
  )

  return sortedClasses.flatMap(({ classId, className }) =>
    (['Semester 1', 'Semester 2'] as const).map((semester) => ({
      value: `${classId}::${semester}`,
      classId,
      className,
      semester,
    })),
  )
}

function getTermOption(value: string, options: GradeTermOption[]) {
  return options.find((option) => option.value === value) ?? null
}

function getDefaultTerm(
  options: GradeTermOption[],
  defaultClassId: number | null,
) {
  const defaultClassOption = options.find(
    (option) =>
      option.classId === defaultClassId && option.semester === 'Semester 1',
  )
  return defaultClassOption?.value ?? options[0]?.value ?? ''
}

export default function TeacherGradeEntry({
  assignments,
  defaultClassId,
  initialAssignmentError,
  initialDate,
  initialStudents,
  initialStudentsError,
  teacherName,
}: TeacherGradeEntryProps) {
  const router = useRouter()
  const studentsRequestId = useRef(0)
  const [availableAssignments, setAvailableAssignments] = useState(assignments)
  const [assignmentError, setAssignmentError] = useState(
    initialAssignmentError,
  )
  const [isLoadingAssignments, setIsLoadingAssignments] = useState(false)
  const termOptions = useMemo(
    () => createTermOptions(availableAssignments),
    [availableAssignments],
  )
  const defaultTerm = getDefaultTerm(termOptions, defaultClassId)
  const [selectedTerm, setSelectedTerm] = useState(defaultTerm)
  const [selectedAssignmentId, setSelectedAssignmentId] = useState('')
  const [students, setStudents] = useState(initialStudents)
  const [studentsError, setStudentsError] = useState(initialStudentsError)
  const [isLoadingStudents, setIsLoadingStudents] = useState(false)
  const [selectedStudentId, setSelectedStudentId] = useState('')
  const [gradeKind, setGradeKind] = useState<GradeKind>('harian')
  const [assessmentName, setAssessmentName] = useState('')
  const [assessmentDate, setAssessmentDate] = useState(initialDate)
  const [score, setScore] = useState('')
  const [comment, setComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [feedback, setFeedback] = useState<Feedback | null>(null)

  const selectedTermValue = termOptions.some(
    (option) => option.value === selectedTerm,
  )
    ? selectedTerm
    : defaultTerm
  const currentTerm = getTermOption(selectedTermValue, termOptions)
  const selectedClassId = currentTerm?.classId ?? null
  const assignmentsForTerm = availableAssignments.filter(
    (assignment) => assignment.kelas_id === selectedClassId,
  )

  useEffect(
    () => () => {
      studentsRequestId.current += 1
    },
    [],
  )

  async function loadStudents(classId: number, className: string) {
    const requestId = ++studentsRequestId.current
    setIsLoadingStudents(true)
    setStudents([])
    setStudentsError(null)
    const result = await fetchTeacherGradeStudents(classId)
    if (requestId !== studentsRequestId.current) return

    if (result.status === 'success') {
      setStudents(result.data)
      setStudentsError(
        result.data.length === 0
          ? `Belum ada siswa aktif di ${className}.`
          : null,
      )
    } else {
      setStudentsError(result.message)
    }
    setIsLoadingStudents(false)
  }

  async function reloadAssignments() {
    setIsLoadingAssignments(true)
    setAssignmentError(null)
    const result = await fetchTeacherGradeAssignments()

    if (result.status === 'success') {
      const newTermOptions = createTermOptions(result.data)
      const nextDefaultTerm = getDefaultTerm(newTermOptions, defaultClassId)
      setAvailableAssignments(result.data)
      setSelectedTerm(nextDefaultTerm)
      setSelectedAssignmentId('')
      setSelectedStudentId('')
      const nextTerm = getTermOption(nextDefaultTerm, newTermOptions)
      if (nextTerm) {
        void loadStudents(nextTerm.classId, nextTerm.className)
      } else {
        setAssignmentError(
          'Belum ada penugasan mapel aktif untuk akun guru ini. Hubungi admin.',
        )
      }
    } else {
      setAssignmentError(result.message)
    }
    setIsLoadingAssignments(false)
  }

  function handleTermChange(value: string) {
    const previousTerm = getTermOption(selectedTermValue, termOptions)
    const nextTerm = getTermOption(value, termOptions)
    setSelectedTerm(value)
    setSelectedAssignmentId('')
    setFeedback(null)
    if (previousTerm?.classId !== nextTerm?.classId) {
      setSelectedStudentId('')
      if (nextTerm) {
        void loadStudents(nextTerm.classId, nextTerm.className)
      }
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const student = students.find(
      (item) => String(item.id) === selectedStudentId,
    )
    const assignment = availableAssignments.find(
      (item) => String(item.id) === selectedAssignmentId,
    )
    const numericScore = Number(score)

    if (!currentTerm || !student || !assignment) {
      setFeedback({
        status: 'error',
        message: 'Pilih kelas, semester, siswa, dan penugasan mapel terlebih dahulu.',
      })
      return
    }
    if (
      student.kelas_id !== currentTerm.classId ||
      assignment.kelas_id !== currentTerm.classId
    ) {
      setFeedback({
        status: 'error',
        message: 'Siswa dan penugasan mapel harus berasal dari kelas yang dipilih.',
      })
      return
    }
    if (student.tahun_angkatan === null || student.tahun_angkatan <= 0) {
      setFeedback({
        status: 'error',
        message:
          'Tahun angkatan siswa belum valid. Lengkapi data siswa terlebih dahulu.',
      })
      return
    }
    if (
      !score.trim() ||
      !Number.isInteger(numericScore) ||
      numericScore < 0 ||
      numericScore > 100
    ) {
      setFeedback({
        status: 'error',
        message: 'Skor harus berupa bilangan bulat dari 0 sampai 100.',
      })
      return
    }
    if (comment.length > 1000) {
      setFeedback({
        status: 'error',
        message: 'Catatan maksimal 1.000 karakter.',
      })
      return
    }
    if (
      gradeKind === 'harian' &&
      (!assessmentName.trim() || assessmentName.trim().length > 100)
    ) {
      setFeedback({
        status: 'error',
        message: 'Nama penilaian harian wajib diisi dan maksimal 100 karakter.',
      })
      return
    }
    if (
      gradeKind === 'harian' &&
      (!/^\d{4}-\d{2}-\d{2}$/.test(assessmentDate) ||
        assessmentDate > initialDate)
    ) {
      setFeedback({
        status: 'error',
        message: 'Tanggal penilaian tidak valid atau berada di masa depan.',
      })
      return
    }

    setIsSubmitting(true)
    setFeedback(null)
    const result = await saveTeacherGrade({
      studentId: student.id,
      assignmentId: assignment.id,
      semester: currentTerm.semester,
      kind: gradeKind,
      score: numericScore,
      comment,
      assessmentName,
      assessmentDate,
    })
    setIsSubmitting(false)

    if (result.status === 'error') {
      setFeedback({ status: 'error', message: result.message })
      return
    }

    setFeedback({ status: 'success', message: result.data })
    const resetTerm = getTermOption(defaultTerm, termOptions)
    if (resetTerm && resetTerm.classId !== currentTerm.classId) {
      void loadStudents(resetTerm.classId, resetTerm.className)
    }
    setSelectedTerm(defaultTerm)
    setSelectedAssignmentId('')
    setSelectedStudentId('')
    setGradeKind('harian')
    setAssessmentName('')
    setAssessmentDate(initialDate)
    setScore('')
    setComment('')
    router.refresh()
  }

  if (isLoadingAssignments) {
    return (
      <div
        aria-busy="true"
        className="rounded-2xl border border-[#e5ebe7] bg-white p-6 text-sm text-[#65736a] dark:border-[#616161] dark:bg-[#1c2d35] dark:text-[#c5c2ba]"
        role="status"
      >
        Memuat penugasan guru…
      </div>
    )
  }

  if (assignmentError && availableAssignments.length === 0) {
    return (
      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-900 dark:border-[#795d23] dark:bg-[#3b3020] dark:text-[#ffe0a3]">
        <p className="text-sm leading-6" role="alert">
          {assignmentError}
        </p>
        <button
          className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-xl border border-amber-300 px-4 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60 dark:border-[#a27a2d]"
          disabled={isLoadingAssignments}
          onClick={() => void reloadAssignments()}
          type="button"
        >
          <RefreshCw aria-hidden="true" size={15} />
          Coba lagi
        </button>
      </section>
    )
  }

  if (availableAssignments.length === 0) {
    return (
      <section className="rounded-2xl border border-dashed border-[#dce5df] bg-white px-5 py-12 text-center dark:border-[#616161] dark:bg-[#1c2d35]">
        <UserRound
          aria-hidden="true"
          className="mx-auto text-[#8a9990] dark:text-[#d8d5cd]"
          size={28}
        />
        <h2 className="mt-3 text-base font-semibold text-[#26382e] dark:text-[#e8e5de]">
          Belum ada penugasan mapel aktif
        </h2>
        <p className="mt-1 text-sm text-[#718078] dark:text-[#c5c2ba]">
          Hubungi admin untuk mengatur penugasan kelas dan mata pelajaran.
        </p>
      </section>
    )
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-2xl bg-gradient-to-br from-[#0f5132] to-[#218354] p-6 text-white shadow-lg shadow-[#0f5132]/10">
        <div className="flex items-start justify-between gap-4">
          <span className="grid size-11 place-items-center rounded-xl bg-white/15">
            <Edit3 aria-hidden="true" size={22} />
          </span>
          <span className="rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold">
            {initialDate}
          </span>
        </div>
        <p className="mt-5 text-sm text-white/80">Halo, {teacherName}</p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight">
          Lembar Nilai Digital
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-white/80">
          Pilih siswa dan mata pelajaran untuk mencatat hasil belajar.
        </p>
      </section>

      {assignmentError ? (
        <p
          className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-[#795d23] dark:bg-[#3b3020] dark:text-[#ffe0a3]"
          role="alert"
        >
          {assignmentError}
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
        className="rounded-2xl border border-[#e5ebe7] bg-white p-5 shadow-sm dark:border-[#616161] dark:bg-[#1c2d35] sm:p-6"
        onSubmit={(event) => void handleSubmit(event)}
      >
        <div className="grid gap-5 lg:grid-cols-2">
          <label>
            <span className={labelClassName}>Siswa</span>
            <select
              className={fieldClassName}
              disabled={isLoadingStudents || students.length === 0}
              onChange={(event) => setSelectedStudentId(event.target.value)}
              required
              value={selectedStudentId}
            >
              <option value="">Pilih nama siswa</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.nama_lengkap} ({student.nomor_induk})
                </option>
              ))}
            </select>
            {isLoadingStudents ? (
              <span className="mt-1 block text-xs text-[#718078] dark:text-[#c5c2ba]">
                Memuat siswa…
              </span>
            ) : studentsError ? (
              <span
                className="mt-1 flex items-center justify-between gap-2 text-xs text-red-700 dark:text-red-300"
                role="alert"
              >
                {studentsError}
                <button
                  className="inline-flex min-h-8 shrink-0 items-center gap-1 font-semibold underline disabled:cursor-not-allowed"
                  disabled={!currentTerm}
                  onClick={() => {
                    if (currentTerm) {
                      void loadStudents(
                        currentTerm.classId,
                        currentTerm.className,
                      )
                    }
                  }}
                  type="button"
                >
                  <RefreshCw aria-hidden="true" size={13} />
                  Coba lagi
                </button>
              </span>
            ) : null}
          </label>

          <label>
            <span className={labelClassName}>Tingkat kelas & semester</span>
            <select
              className={fieldClassName}
              onChange={(event) => handleTermChange(event.target.value)}
              required
              value={selectedTerm}
            >
              {termOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.className} - {option.semester}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className={labelClassName}>Mapel & tahun ajaran</span>
            <select
              className={fieldClassName}
              disabled={!assignmentsForTerm.length}
              onChange={(event) => setSelectedAssignmentId(event.target.value)}
              required
              value={selectedAssignmentId}
            >
              <option value="">Pilih penugasan mapel</option>
              {assignmentsForTerm.map((assignment) => (
                <option key={assignment.id} value={assignment.id}>
                  {assignment.mata_pelajaran} ({assignment.tahun_ajaran})
                </option>
              ))}
            </select>
            {assignmentsForTerm.length === 0 ? (
              <span className="mt-1 block text-xs text-red-700 dark:text-red-300">
                Belum ada penugasan mapel aktif untuk kelas ini. Hubungi admin.
              </span>
            ) : null}
          </label>

          <fieldset>
            <legend className={`${labelClassName} mb-2`}>
              Jenis penilaian
            </legend>
            <div className="flex flex-wrap gap-2">
              {gradeKindOptions.map(({ value, label }) => {
                const isSelected = gradeKind === value
                return (
                  <button
                    aria-pressed={isSelected}
                    className={
                      isSelected
                        ? 'min-h-10 rounded-full bg-[#0f5132] px-4 text-sm font-semibold text-white dark:bg-[#ffd166] dark:text-[#26382e]'
                        : 'min-h-10 rounded-full border border-[#dce5df] px-4 text-sm font-semibold text-[#456052] dark:border-[#616161] dark:text-[#e8e5de]'
                    }
                    key={value}
                    onClick={() => {
                      setGradeKind(value)
                      setFeedback(null)
                    }}
                    type="button"
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          </fieldset>

          {gradeKind === 'harian' ? (
            <>
              <label>
                <span className={labelClassName}>Nama penilaian harian</span>
                <input
                  className={fieldClassName}
                  maxLength={100}
                  onChange={(event) => setAssessmentName(event.target.value)}
                  placeholder="Contoh: Kuis Bab 1"
                  required
                  value={assessmentName}
                />
              </label>
              <label>
                <span className={labelClassName}>Tanggal penilaian</span>
                <span className="relative block">
                  <CalendarDays
                    aria-hidden="true"
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#718078] dark:text-[#c5c2ba]"
                    size={17}
                  />
                  <input
                    className={`${fieldClassName} pl-10`}
                    max={initialDate}
                    min="2000-01-01"
                    onChange={(event) => setAssessmentDate(event.target.value)}
                    required
                    type="date"
                    value={assessmentDate}
                  />
                </span>
              </label>
            </>
          ) : null}

          <label>
            <span className={labelClassName}>
              Skor nilai {gradeKind.toUpperCase()} (0–100)
            </span>
            <input
              className={fieldClassName}
              inputMode="numeric"
              max={100}
              min={0}
              onChange={(event) => setScore(event.target.value)}
              required
              step={1}
              type="number"
              value={score}
            />
          </label>

          <label className={gradeKind === 'harian' ? 'lg:col-span-2' : ''}>
            <span className={labelClassName}>
              Catatan perkembangan siswa (opsional)
            </span>
            <textarea
              className={`${fieldClassName} min-h-24 py-3`}
              maxLength={1000}
              onChange={(event) => setComment(event.target.value)}
              rows={3}
              value={comment}
            />
            <span className="mt-1 block text-right text-[11px] text-[#718078] dark:text-[#c5c2ba]">
              {comment.length}/1.000
            </span>
          </label>
        </div>

        {gradeKind !== 'harian' ? (
          <p className="mt-4 rounded-xl bg-[#f7f9f7] px-4 py-3 text-xs leading-5 text-[#65736a] dark:bg-[#111b21] dark:text-[#c5c2ba]">
            Nilai {gradeKind.toUpperCase()} hanya dapat disimpan satu kali untuk
            setiap siswa, mapel, dan semester. Pastikan skor sudah benar sebelum
            menyimpan.
          </p>
        ) : null}

        <button
          className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#0f5132] px-5 text-sm font-bold text-white transition hover:bg-[#0b4229] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[#ffd166] dark:text-[#26382e] dark:hover:bg-[#f2c65d]"
          disabled={
            isSubmitting ||
            isLoadingStudents ||
            students.length === 0 ||
            !assignmentsForTerm.length
          }
          type="submit"
        >
          {isSubmitting ? (
            <span
              aria-hidden="true"
              className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent"
            />
          ) : (
            <Save aria-hidden="true" size={17} />
          )}
          {isSubmitting ? 'Menyimpan…' : 'Simpan nilai rapor'}
        </button>
      </form>
    </div>
  )
}
