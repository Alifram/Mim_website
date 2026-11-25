'use client'

import { useMemo, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { BookOpen, CalendarDays, Plus, School, UserRound } from 'lucide-react'

import type {
  AdminAssignmentData,
  AssignmentTeacher,
} from '@/lib/services/assignments/assignment-service'
import { createClassSubjectAssignment } from '@/lib/services/assignments/assignment-mutation-service'

type AssignmentManagementProps = {
  data: AdminAssignmentData
  loadError: string | null
  initialSchoolYear: string
}

const fieldClassName =
  'min-h-11 w-full rounded-xl border border-[#dce5df] bg-white px-3.5 text-sm text-[#26382e] outline-none transition focus:border-[#0f5132] focus:ring-2 focus:ring-[#0f5132]/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-[#616161] dark:bg-[#111b21] dark:text-[#e8e5de] dark:focus:border-[#ffd166] dark:focus:ring-[#ffd166]/10'

const labelClassName =
  'mb-1.5 block text-xs font-semibold text-[#35463b] dark:text-[#e8e5de]'

function isTeacherEligible(teacher: AssignmentTeacher, classId: number) {
  return (
    teacher.jenis_guru === 'guru_mapel' ||
    (teacher.jenis_guru === 'guru_kelas' && teacher.kelas_id === classId)
  )
}

export default function AssignmentManagement({
  data,
  loadError,
  initialSchoolYear,
}: AssignmentManagementProps) {
  const router = useRouter()
  const [classId, setClassId] = useState('')
  const [subjectId, setSubjectId] = useState('')
  const [teacherId, setTeacherId] = useState('')
  const [schoolYear, setSchoolYear] = useState(initialSchoolYear)
  const [isSaving, setIsSaving] = useState(false)
  const [feedback, setFeedback] = useState<{
    status: 'success' | 'error'
    message: string
  } | null>(null)

  const selectedClassId = Number(classId)
  const eligibleTeachers = useMemo(
    () =>
      classId && Number.isSafeInteger(selectedClassId)
        ? data.teachers.filter((teacher) =>
            isTeacherEligible(teacher, selectedClassId),
          )
        : [],
    [classId, data.teachers, selectedClassId],
  )

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isSaving) return

    if (!classId || !subjectId || !teacherId) {
      setFeedback({
        status: 'error',
        message: 'Pilih kelas, mata pelajaran, dan guru pengampu.',
      })
      return
    }

    if (
      !/^\d{4}\/\d{4}$/.test(schoolYear.trim()) ||
      Number(schoolYear.trim().slice(5)) !==
        Number(schoolYear.trim().slice(0, 4)) + 1
    ) {
      setFeedback({
        status: 'error',
        message:
          'Gunakan format tahun ajaran YYYY/YYYY; tahun akhir harus satu tahun setelah tahun awal.',
      })
      return
    }

    setIsSaving(true)
    setFeedback(null)

    try {
      const result = await createClassSubjectAssignment({
        classId: Number(classId),
        subjectId: Number(subjectId),
        teacherId: Number(teacherId),
        schoolYear: schoolYear.trim(),
      })

      setFeedback(result)
      if (result.status === 'success') {
        setClassId('')
        setSubjectId('')
        setTeacherId('')
        router.refresh()
      }
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#0f6a42] dark:text-[#ffd166]">
            Administrasi akademik
          </p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-[#1d2b23] dark:text-[#e8e5de]">
            Penugasan Mapel
          </h2>
          <p className="mt-2 text-sm leading-6 text-[#65736a] dark:text-[#c5c2ba]">
            Tentukan guru pengampu mata pelajaran untuk setiap kelas dan tahun
            ajaran.
          </p>
        </div>
      </header>

      {loadError ? (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 dark:border-[#795d23] dark:bg-[#3b3020]">
          <h3 className="text-sm font-bold text-amber-900 dark:text-[#ffe0a3]">
            Data penugasan belum tersedia
          </h3>
          <p className="mt-2 text-sm leading-6 text-amber-900 dark:text-[#ffe0a3]">
            {loadError}
          </p>
        </section>
      ) : (
        <>
          <section className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <form
              className="h-fit rounded-2xl border border-[#e5ebe7] bg-white p-5 shadow-sm dark:border-[#616161] dark:bg-[#1c2d35] sm:p-6"
              onSubmit={handleSubmit}
            >
              <div className="mb-5 flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-[#eaf3ed] text-[#0f5132] dark:bg-[#34434b] dark:text-[#ffd166]">
                  <Plus aria-hidden="true" size={19} />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-[#26382e] dark:text-[#e8e5de]">
                    Tambah penugasan
                  </h3>
                  <p className="mt-0.5 text-xs text-[#718078] dark:text-[#c5c2ba]">
                    Pilih kelas, mapel, guru, dan tahun ajaran.
                  </p>
                </div>
              </div>

              {data.classes.length === 0 ? (
                <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-xs leading-5 text-amber-900 dark:border-[#795d23] dark:bg-[#3b3020] dark:text-[#ffe0a3]">
                  Belum ada kelas aktif. Tambahkan atau aktifkan kelas sebelum
                  membuat penugasan.
                </p>
              ) : null}
              {data.subjects.length === 0 ? (
                <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-xs leading-5 text-amber-900 dark:border-[#795d23] dark:bg-[#3b3020] dark:text-[#ffe0a3]">
                  Belum ada mata pelajaran aktif. Tambahkan mata pelajaran
                  terlebih dahulu.
                </p>
              ) : null}

              <label className={labelClassName} htmlFor="assignment-class">
                Kelas
              </label>
              <select
                className={fieldClassName}
                disabled={!data.classes.length}
                id="assignment-class"
                onChange={(event) => {
                  setClassId(event.target.value)
                  setTeacherId('')
                  setFeedback(null)
                }}
                required
                value={classId}
              >
                <option value="">Pilih kelas</option>
                {data.classes.map((schoolClass) => (
                  <option key={schoolClass.id} value={schoolClass.id}>
                    {schoolClass.nama}
                  </option>
                ))}
              </select>

              <label
                className={`${labelClassName} mt-4`}
                htmlFor="assignment-subject"
              >
                Mata pelajaran
              </label>
              <select
                className={fieldClassName}
                disabled={!data.subjects.length}
                id="assignment-subject"
                onChange={(event) => setSubjectId(event.target.value)}
                required
                value={subjectId}
              >
                <option value="">Pilih mata pelajaran</option>
                {data.subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.nama} ({subject.kode})
                  </option>
                ))}
              </select>

              <label
                className={`${labelClassName} mt-4`}
                htmlFor="assignment-teacher"
              >
                Guru pengampu
              </label>
              <select
                className={fieldClassName}
                disabled={!classId || eligibleTeachers.length === 0}
                id="assignment-teacher"
                onChange={(event) => setTeacherId(event.target.value)}
                required
                value={teacherId}
              >
                <option value="">
                  {!classId
                    ? 'Pilih kelas terlebih dahulu'
                    : eligibleTeachers.length
                      ? 'Pilih guru pengampu'
                      : 'Tidak ada guru yang sesuai'}
                </option>
                {eligibleTeachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.nama_lengkap}
                    {teacher.jenis_guru === 'guru_kelas'
                      ? ' · Guru kelas'
                      : ' · Guru mapel'}
                  </option>
                ))}
              </select>
              {classId && eligibleTeachers.length === 0 ? (
                <p className="mt-2 text-xs leading-5 text-amber-800 dark:text-[#ffe0a3]">
                  Tidak ada guru yang dapat mengajar di kelas ini. Guru mapel
                  berlaku untuk semua kelas; guru kelas hanya untuk kelas yang
                  ditetapkan pada profilnya.
                </p>
              ) : null}

              <label
                className={`${labelClassName} mt-4`}
                htmlFor="assignment-year"
              >
                Tahun ajaran
              </label>
              <input
                className={fieldClassName}
                id="assignment-year"
                maxLength={9}
                onChange={(event) => setSchoolYear(event.target.value)}
                placeholder="Contoh: 2026/2027"
                required
                value={schoolYear}
              />
              <p className="mt-1.5 text-xs text-[#718078] dark:text-[#c5c2ba]">
                Format YYYY/YYYY, contoh 2026/2027.
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

              <button
                className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#0f5132] px-4 text-sm font-bold text-white transition hover:bg-[#0b4229] disabled:cursor-wait disabled:opacity-60 dark:bg-[#ffd166] dark:text-[#172027] dark:hover:bg-[#ffdc85]"
                disabled={
                  isSaving ||
                  data.classes.length === 0 ||
                  data.subjects.length === 0 ||
                  eligibleTeachers.length === 0
                }
                type="submit"
              >
                <Plus aria-hidden="true" size={17} />
                {isSaving ? 'Menyimpan…' : 'Simpan penugasan'}
              </button>
            </form>

            <section className="overflow-hidden rounded-2xl border border-[#e5ebe7] bg-white shadow-sm dark:border-[#616161] dark:bg-[#1c2d35]">
              <div className="border-b border-[#e7ece8] p-4 dark:border-[#424242] sm:px-5">
                <h3 className="text-sm font-bold text-[#26382e] dark:text-[#e8e5de]">
                  Penugasan aktif
                </h3>
                <p className="mt-1 text-xs text-[#718078] dark:text-[#c5c2ba]">
                  {data.assignments.length.toLocaleString('id-ID')} penugasan
                </p>
              </div>

              {data.assignments.length ? (
                <ul className="divide-y divide-[#edf0ed] dark:divide-[#424242]">
                  {data.assignments.map((assignment) => (
                    <li
                      className="flex items-start gap-3 px-4 py-4 sm:px-5"
                      key={assignment.id}
                    >
                      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#eaf3ed] text-[#0f5132] dark:bg-[#34434b] dark:text-[#ffd166]">
                        <BookOpen aria-hidden="true" size={18} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-[#26382e] dark:text-[#e8e5de]">
                          {assignment.kelas} · {assignment.mata_pelajaran}
                        </p>
                        <p className="mt-1 text-xs text-[#65736a] dark:text-[#c5c2ba]">
                          {assignment.guru_pengampu}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-[#718078] dark:text-[#c5c2ba]">
                          <span className="inline-flex items-center gap-1">
                            <School aria-hidden="true" size={13} />
                            {assignment.kelas}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <UserRound aria-hidden="true" size={13} />
                            Guru pengampu
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <CalendarDays aria-hidden="true" size={13} />
                            {assignment.tahun_ajaran}
                          </span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="px-5 py-12 text-center">
                  <BookOpen
                    aria-hidden="true"
                    className="mx-auto text-[#8a9990] dark:text-[#d8d5cd]"
                    size={27}
                  />
                  <p className="mt-3 text-sm font-semibold text-[#26382e] dark:text-[#e8e5de]">
                    Belum ada penugasan aktif
                  </p>
                  <p className="mt-1 text-xs text-[#718078] dark:text-[#c5c2ba]">
                    Penugasan yang berhasil disimpan akan muncul di sini.
                  </p>
                </div>
              )}
            </section>
          </section>

          <p className="text-xs leading-5 text-[#718078] dark:text-[#c5c2ba]">
            Guru mata pelajaran dapat ditugaskan ke semua kelas. Guru kelas
            hanya dapat ditugaskan ke kelas yang tercatat pada profilnya.
          </p>
        </>
      )}
    </div>
  )
}
