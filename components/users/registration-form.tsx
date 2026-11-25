'use client'

import { useMemo, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { UserPlus } from 'lucide-react'

import type { AdminStudent } from '@/lib/services/classes/class-service'
import {
  registerSchoolAccount,
  type RegistrationPayload,
  type RegistrationRole,
} from '@/lib/services/users/registration-service'
import type { RegistrationClass } from '@/lib/services/users/registration-options-service'

type RegistrationFormProps = {
  classes: RegistrationClass[]
  students: AdminStudent[]
  classError: string | null
  studentError: string | null
  currentYear: number
}

type Feedback = {
  tone: 'success' | 'warning' | 'error'
  message: string
}

const paymentCategories = [
  { code: 'infaq', label: 'Infaq' },
  { code: 'wakaf', label: 'Wakaf' },
  { code: 'buku', label: 'Buku' },
  { code: 'pramuka', label: 'Pramuka' },
  { code: 'hw', label: 'HW' },
  { code: 'koperasi', label: 'Koperasi' },
]

const inputClassName =
  'min-h-11 w-full rounded-xl border border-[#dce5df] bg-white px-3.5 text-sm text-[#26382e] outline-none transition placeholder:text-[#9aa69f] focus:border-[#0f5132] focus:ring-2 focus:ring-[#0f5132]/10 dark:border-[#616161] dark:bg-[#111b21] dark:text-[#e8e5de] dark:placeholder:text-[#aaa79f] dark:focus:border-[#ffd166] dark:focus:ring-[#ffd166]/10'

const labelClassName =
  'mb-1.5 block text-xs font-semibold text-[#35463b] dark:text-[#e8e5de]'

export default function RegistrationForm({
  classes,
  students,
  classError,
  studentError,
  currentYear,
}: RegistrationFormProps) {
  const router = useRouter()
  const [role, setRole] = useState<RegistrationRole>('siswa')
  const [teacherType, setTeacherType] = useState<
    'guru_kelas' | 'guru_mapel' | ''
  >('')
  const [classId, setClassId] = useState(
    classes[0] ? String(classes[0].id) : '',
  )
  const [admissionYear, setAdmissionYear] = useState(String(currentYear))
  const [studentNumber, setStudentNumber] = useState('')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [studentSearch, setStudentSearch] = useState('')
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [feedback, setFeedback] = useState<Feedback | null>(null)

  const requiresClass =
    role === 'siswa' || (role === 'guru' && teacherType === 'guru_kelas')
  const admissionYears = Array.from(
    { length: currentYear + 5 - 2023 + 1 },
    (_, index) => 2023 + index,
  )

  const visibleStudents = useMemo(() => {
    const query = studentSearch.trim().toLocaleLowerCase()

    return students.filter((student) =>
      `${student.nama_lengkap} ${student.nomor_induk} ${student.kelas_nama ?? ''}`
        .toLocaleLowerCase()
        .includes(query),
    )
  }, [studentSearch, students])

  function resetForm() {
    setRole('siswa')
    setTeacherType('')
    setClassId(classes[0] ? String(classes[0].id) : '')
    setAdmissionYear(String(currentYear))
    setStudentNumber('')
    setFullName('')
    setEmail('')
    setPassword('')
    setStudentSearch('')
    setSelectedStudentIds([])
    setSelectedCategories([])
  }

  function handleRoleChange(nextRole: RegistrationRole) {
    setRole(nextRole)
    setTeacherType('')
    setClassId(classes[0] ? String(classes[0].id) : '')
    setSelectedStudentIds([])
    setSelectedCategories([])
    setFeedback(null)
  }

  function validateForm() {
    if (!studentNumber.trim() || studentNumber.trim().length > 50) {
      return 'Nomor identitas wajib diisi dan maksimal 50 karakter.'
    }
    if (!fullName.trim() || fullName.trim().length > 100) {
      return 'Nama lengkap wajib diisi dan maksimal 100 karakter.'
    }
    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
      email.trim().length > 100
    ) {
      return 'Masukkan alamat email yang valid (maksimal 100 karakter).'
    }
    if (password.length < 6) {
      return 'Password awal minimal 6 karakter.'
    }
    if (role === 'guru' && !teacherType) {
      return 'Pilih jenis guru terlebih dahulu.'
    }
    if (requiresClass && (!classId || !classes.some((item) => item.id === Number(classId)))) {
      return classError ?? 'Pilih kelas aktif terlebih dahulu.'
    }
    if (
      role === 'siswa' &&
      (!Number.isInteger(Number(admissionYear)) ||
        Number(admissionYear) < 2000 ||
        Number(admissionYear) > currentYear + 5)
    ) {
      return 'Pilih tahun angkatan yang valid.'
    }
    if (role === 'orang_tua') {
      if (studentError) return studentError
      if (!selectedStudentIds.length) {
        return 'Pilih setidaknya satu anak untuk akun orang tua.'
      }
      if (selectedStudentIds.length > 20) {
        return 'Akun orang tua hanya dapat ditautkan ke maksimal 20 siswa.'
      }
    }
    if (role === 'petugas_keuangan' && !selectedCategories.length) {
      return 'Pilih setidaknya satu jenis pembayaran untuk petugas.'
    }

    return null
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isSubmitting) return

    const validationMessage = validateForm()
    if (validationMessage) {
      setFeedback({ tone: 'error', message: validationMessage })
      return
    }

    const payload: RegistrationPayload = {
      nomor_induk: studentNumber.trim(),
      nama_lengkap: fullName.trim(),
      email: email.trim().toLowerCase(),
      password,
      role,
      jenis_guru: role === 'guru' ? teacherType || null : null,
      kelas_id: requiresClass ? Number(classId) : null,
      tahun_angkatan: role === 'siswa' ? Number(admissionYear) : null,
    }

    setIsSubmitting(true)
    setFeedback(null)

    try {
      const result = await registerSchoolAccount(
        payload,
        selectedStudentIds,
        selectedCategories,
      )

      if (result.status === 'error') {
        setFeedback({ tone: 'error', message: result.message })
        return
      }

      setFeedback({
        tone: result.status === 'success' ? 'success' : 'warning',
        message: result.message,
      })
      resetForm()
      router.refresh()
    } catch {
      setFeedback({
        tone: 'error',
        message:
          'Status pendaftaran belum dapat dipastikan. Periksa daftar pengguna sebelum mengirim ulang.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#0f6a42] dark:text-[#ffd166]">
          Administrasi
        </p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-[#1d2b23] dark:text-[#e8e5de]">
          Registrasi akun
        </h2>
        <p className="mt-2 text-sm leading-6 text-[#65736a] dark:text-[#c5c2ba]">
          Buat akun warga sekolah. Akun akan aktif dan dapat digunakan dengan
          password awal yang ditetapkan.
        </p>
      </header>

      <form
        className="overflow-hidden rounded-2xl border border-[#e5ebe7] bg-white shadow-sm dark:border-[#616161] dark:bg-[#1c2d35]"
        noValidate
        onSubmit={handleSubmit}
      >
        <div className="space-y-6 p-5 sm:p-7">
          <div className="max-w-sm">
            <label className={labelClassName} htmlFor="account-role">
              Jenis akun
            </label>
            <select
              className={inputClassName}
              id="account-role"
              onChange={(event) =>
                handleRoleChange(event.target.value as RegistrationRole)
              }
              value={role}
            >
              <option value="siswa">Siswa</option>
              <option value="guru">Guru</option>
              <option value="orang_tua">Orang tua</option>
              <option value="petugas_keuangan">Petugas keuangan</option>
            </select>
          </div>

          {role === 'guru' ? (
            <div className="max-w-sm">
              <label className={labelClassName} htmlFor="teacher-type">
                Jenis guru
              </label>
              <select
                className={inputClassName}
                id="teacher-type"
                onChange={(event) =>
                  setTeacherType(
                    event.target.value as 'guru_kelas' | 'guru_mapel' | '',
                  )
                }
                value={teacherType}
              >
                <option value="">Pilih jenis guru</option>
                <option value="guru_kelas">Guru kelas</option>
                <option value="guru_mapel">Guru mata pelajaran</option>
              </select>
            </div>
          ) : null}

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className={labelClassName} htmlFor="student-number">
                {role === 'siswa'
                  ? 'NIS (Nomor Induk Siswa)'
                  : role === 'guru'
                    ? 'NIP (Nomor Induk Pegawai)'
                    : role === 'orang_tua'
                      ? 'Nomor identitas orang tua'
                      : 'Nomor identitas petugas'}
              </label>
              <input
                autoComplete="off"
                className={inputClassName}
                id="student-number"
                maxLength={50}
                onChange={(event) => setStudentNumber(event.target.value)}
                placeholder="Masukkan nomor identitas"
                value={studentNumber}
              />
            </div>

            <div>
              <label className={labelClassName} htmlFor="full-name">
                Nama lengkap
              </label>
              <input
                autoComplete="name"
                className={inputClassName}
                id="full-name"
                maxLength={100}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="Masukkan nama lengkap"
                value={fullName}
              />
            </div>

            <div>
              <label className={labelClassName} htmlFor="account-email">
                Alamat email
              </label>
              <input
                autoCapitalize="none"
                autoComplete="email"
                className={inputClassName}
                id="account-email"
                maxLength={100}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="nama@contoh.com"
                type="email"
                value={email}
              />
            </div>

            <div>
              <label className={labelClassName} htmlFor="initial-password">
                Password awal
              </label>
              <input
                autoComplete="new-password"
                className={inputClassName}
                id="initial-password"
                minLength={6}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Minimal 6 karakter"
                type="password"
                value={password}
              />
            </div>
          </div>

          {requiresClass ? (
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className={labelClassName} htmlFor="account-class">
                  Kelas
                </label>
                <select
                  className={inputClassName}
                  disabled={!classes.length}
                  id="account-class"
                  onChange={(event) => setClassId(event.target.value)}
                  value={classId}
                >
                  <option value="">Pilih kelas</option>
                  {classes.map((schoolClass) => (
                    <option key={schoolClass.id} value={schoolClass.id}>
                      {schoolClass.nama}
                    </option>
                  ))}
                </select>
                {classError ? (
                  <p className="mt-2 text-xs leading-5 text-amber-800 dark:text-[#ffe0a3]">
                    {classError}
                  </p>
                ) : null}
              </div>

              {role === 'siswa' ? (
                <div>
                  <label className={labelClassName} htmlFor="admission-year">
                    Tahun angkatan
                  </label>
                  <select
                    className={inputClassName}
                    id="admission-year"
                    onChange={(event) => setAdmissionYear(event.target.value)}
                    value={admissionYear}
                  >
                    {admissionYears.map((year) => (
                      <option key={year} value={year}>
                        Angkatan {year}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}
            </div>
          ) : null}

          {role === 'orang_tua' ? (
            <section aria-labelledby="linked-students-title">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h3
                    className="text-sm font-bold text-[#26382e] dark:text-[#e8e5de]"
                    id="linked-students-title"
                  >
                    Anak yang dapat dilihat
                  </h3>
                  <p className="mt-1 text-xs text-[#718078] dark:text-[#c5c2ba]">
                    Pilih satu sampai 20 siswa aktif.
                  </p>
                </div>
                <input
                  aria-label="Cari siswa"
                  className={`${inputClassName} sm:max-w-xs`}
                  onChange={(event) => setStudentSearch(event.target.value)}
                  placeholder="Cari nama, nomor, atau kelas"
                  type="search"
                  value={studentSearch}
                />
              </div>

              {studentError ? (
                <p
                  className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-900 dark:border-[#795d23] dark:bg-[#3b3020] dark:text-[#ffe0a3]"
                  role="alert"
                >
                  {studentError}
                </p>
              ) : null}

              {!studentError && students.length === 0 ? (
                <p className="mt-3 rounded-xl border border-[#e5ebe7] bg-[#f7f9f7] px-4 py-3 text-xs text-[#65736a] dark:border-[#616161] dark:bg-[#111b21] dark:text-[#c5c2ba]">
                  Belum ada siswa aktif untuk ditautkan.
                </p>
              ) : null}

              {visibleStudents.length ? (
                <div className="mt-3 max-h-72 overflow-y-auto rounded-xl border border-[#e5ebe7] dark:border-[#616161]">
                  {visibleStudents.map((student) => {
                    const selected = selectedStudentIds.includes(student.id)
                    const atLimit =
                      selectedStudentIds.length >= 20 && !selected

                    return (
                      <label
                        className="flex cursor-pointer items-start gap-3 border-b border-[#edf0ed] px-4 py-3 last:border-b-0 hover:bg-[#f7f9f7] has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60 dark:border-[#424242] dark:hover:bg-[#34434b]/40"
                        key={student.id}
                      >
                        <input
                          checked={selected}
                          className="mt-0.5 size-4 accent-[#0f5132] dark:accent-[#ffd166]"
                          disabled={atLimit}
                          onChange={(event) =>
                            setSelectedStudentIds((current) =>
                              event.target.checked
                                ? [...current, student.id]
                                : current.filter((id) => id !== student.id),
                            )
                          }
                          type="checkbox"
                        />
                        <span className="min-w-0">
                          <span className="block text-sm font-medium text-[#26382e] dark:text-[#e8e5de]">
                            {student.nama_lengkap}
                          </span>
                          <span className="mt-0.5 block text-xs text-[#718078] dark:text-[#c5c2ba]">
                            {student.nomor_induk}
                            {student.kelas_nama
                              ? ` · ${student.kelas_nama}`
                              : ''}
                          </span>
                        </span>
                      </label>
                    )
                  })}
                </div>
              ) : null}
              <p className="mt-2 text-xs text-[#718078] dark:text-[#c5c2ba]">
                Terpilih: {selectedStudentIds.length}
              </p>
            </section>
          ) : null}

          {role === 'petugas_keuangan' ? (
            <fieldset>
              <legend className="text-sm font-bold text-[#26382e] dark:text-[#e8e5de]">
                Jenis pembayaran yang boleh dikelola
              </legend>
              <div className="mt-3 flex flex-wrap gap-2">
                {paymentCategories.map(({ code, label }) => {
                  const selected = selectedCategories.includes(code)

                  return (
                    <label
                      className={`inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-full border px-3 text-xs font-semibold transition ${
                        selected
                          ? 'border-[#0f5132] bg-[#eaf3ed] text-[#0f5132] dark:border-[#ffd166] dark:bg-[#34434b] dark:text-[#ffd166]'
                          : 'border-[#dce5df] bg-white text-[#65736a] hover:border-[#9bb8a4] dark:border-[#616161] dark:bg-[#111b21] dark:text-[#c5c2ba]'
                      }`}
                      key={code}
                    >
                      <input
                        checked={selected}
                        className="sr-only"
                        onChange={(event) =>
                          setSelectedCategories((current) =>
                            event.target.checked
                              ? [...current, code]
                              : current.filter((item) => item !== code),
                          )
                        }
                        type="checkbox"
                      />
                      {label}
                    </label>
                  )
                })}
              </div>
            </fieldset>
          ) : null}

          {feedback ? (
            <p
              className={`rounded-xl border px-4 py-3 text-sm leading-6 ${
                feedback.tone === 'success'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-[#286345] dark:bg-[#183b2c] dark:text-[#b9f4d0]'
                  : feedback.tone === 'warning'
                    ? 'border-amber-200 bg-amber-50 text-amber-900 dark:border-[#795d23] dark:bg-[#3b3020] dark:text-[#ffe0a3]'
                    : 'border-[#f1c7c7] bg-[#fff6f6] text-[#9c2c2c] dark:border-[#713c3c] dark:bg-[#351d22] dark:text-[#ffc5c5]'
              }`}
              role={feedback.tone === 'error' ? 'alert' : 'status'}
            >
              {feedback.message}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-[#e7ece8] bg-[#f7f9f7] p-5 sm:flex-row sm:items-center sm:justify-between sm:px-7 dark:border-[#424242] dark:bg-[#111b21]">
          <p className="text-xs leading-5 text-[#718078] dark:text-[#c5c2ba]">
            Email dikonfirmasi otomatis. Simpan password awal untuk diberikan
            kepada pemilik akun.
          </p>
          <button
            className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#0f5132] px-5 text-sm font-bold text-white transition hover:bg-[#0b4229] disabled:cursor-wait disabled:opacity-60 dark:bg-[#ffd166] dark:text-[#172027] dark:hover:bg-[#ffdc85]"
            disabled={isSubmitting}
            type="submit"
          >
            <UserPlus aria-hidden="true" size={17} />
            {isSubmitting ? 'Mendaftarkan akun…' : 'Simpan & daftarkan akun'}
          </button>
        </div>
      </form>
    </div>
  )
}
