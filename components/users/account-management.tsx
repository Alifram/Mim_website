'use client'

import { useMemo, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Swal from 'sweetalert2'
import {
  Eye,
  EyeOff,
  KeyRound,
  Pencil,
  Search,
  ShieldCheck,
  UserRoundCog,
  UserRoundX,
} from 'lucide-react'

import {
  fetchAccountConfiguration,
  setManagedAccountStatus,
  updateManagedAccount,
} from '@/lib/services/users/account-management-query-service'
import type {
  AccountManagementClass,
  ManagedAccount,
} from '@/lib/services/users/account-management-service'

type AccountManagementProps = {
  accounts: ManagedAccount[]
  classes: AccountManagementClass[]
  currentAccountId: number
  currentYear: number
  paymentCategories: { code: string; name: string }[]
}

type AccountRole =
  | 'admin'
  | 'guru'
  | 'siswa'
  | 'orang_tua'
  | 'petugas_keuangan'

type Feedback = {
  status: 'success' | 'error'
  message: string
}

function showFeedback({ status, message }: Feedback) {
  return Swal.fire({
    icon: status,
    title: status === 'success' ? 'Berhasil' : 'Terjadi kesalahan',
    text: message,
    confirmButtonText: 'Tutup',
    confirmButtonColor: '#0f5132',
    customClass: {
      popup: 'rounded-2xl',
      confirmButton:
        'rounded-xl bg-[#0f5132] px-5 py-2.5 font-semibold text-white',
    },
    buttonsStyling: false,
  })
}

const fieldClassName =
  'min-h-11 w-full rounded-xl border border-[#dce5df] bg-white px-3.5 text-sm text-[#26382e] outline-none transition focus:border-[#0f5132] focus:ring-2 focus:ring-[#0f5132]/10 disabled:opacity-60 dark:border-[#616161] dark:bg-[#111b21] dark:text-[#e8e5de] dark:focus:border-[#ffd166]'

const labelClassName =
  'mb-1.5 block text-xs font-semibold text-[#35463b] dark:text-[#e8e5de]'

const roleOptions: { value: AccountRole; label: string }[] = [
  { value: 'admin', label: 'Administrator' },
  { value: 'guru', label: 'Guru' },
  { value: 'siswa', label: 'Siswa' },
  { value: 'orang_tua', label: 'Orang tua' },
  { value: 'petugas_keuangan', label: 'Petugas keuangan' },
]

function roleLabel(role: string) {
  return roleOptions.find((option) => option.value === role)?.label ?? role
}

function roleIdentityLabel(role: AccountRole) {
  if (role === 'siswa') return 'NIS'
  if (role === 'guru') return 'NIP'
  if (role === 'orang_tua') return 'Nomor identitas orang tua'
  if (role === 'petugas_keuangan') return 'Nomor identitas petugas'
  return 'Nomor identitas admin'
}

export default function AccountManagement({
  accounts,
  classes,
  currentAccountId,
  currentYear,
  paymentCategories,
}: AccountManagementProps) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('active')
  const [editingAccount, setEditingAccount] = useState<ManagedAccount | null>(
    null,
  )
  const [formReady, setFormReady] = useState(false)
  const [isLoadingConfig, setIsLoadingConfig] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [statusChangingId, setStatusChangingId] = useState<number | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const [studentNumber, setStudentNumber] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<AccountRole>('siswa')
  const [teacherType, setTeacherType] = useState<'guru_kelas' | 'guru_mapel'>(
    'guru_kelas',
  )
  const [classId, setClassId] = useState('')
  const [admissionYear, setAdmissionYear] = useState(String(currentYear))
  const [studentIds, setStudentIds] = useState<number[]>([])
  const [categoryCodes, setCategoryCodes] = useState<string[]>([])
  const [newPassword, setNewPassword] = useState('')

  const students = useMemo(
    () =>
      accounts.filter(
        (account) => account.role === 'siswa' && account.is_deleted === 0,
      ),
    [accounts],
  )

  const visibleAccounts = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase()
    return accounts.filter((account) => {
      if (statusFilter === 'active' && account.is_deleted !== 0) return false
      if (statusFilter === 'inactive' && account.is_deleted === 0) return false
      if (roleFilter !== 'all' && account.role !== roleFilter) return false
      const searchable =
        `${account.nama_lengkap} ${account.nomor_induk} ${account.email} ${account.kelas_nama ?? ''}`
          .toLocaleLowerCase()
      return searchable.includes(normalizedQuery)
    })
  }, [accounts, query, roleFilter, statusFilter])

  const needsClass =
    role === 'siswa' || (role === 'guru' && teacherType === 'guru_kelas')

  async function openEditor(account: ManagedAccount) {
    setEditingAccount(account)
    setFormReady(false)
    setIsLoadingConfig(true)
    setFormError(null)
    setStudentNumber(account.nomor_induk)
    setName(account.nama_lengkap)
    setEmail(account.email)
    setRole(account.role)
    setTeacherType(
      account.jenis_guru === 'guru_mapel' ? 'guru_mapel' : 'guru_kelas',
    )
    setClassId(account.kelas_id === null ? '' : String(account.kelas_id))
    setAdmissionYear(
      String(account.tahun_angkatan ?? currentYear),
    )
    setNewPassword('')

    const configuration = await fetchAccountConfiguration(account.id)
    if (configuration.status === 'error') {
      setFormError(configuration.message)
      setStudentIds([])
      setCategoryCodes([])
    } else {
      setStudentIds(configuration.config.studentUserIds)
      setCategoryCodes(configuration.config.categoryCodes)
    }
    setIsLoadingConfig(false)
    setFormReady(true)
  }

  function closeEditor() {
    if (isSaving) return
    setEditingAccount(null)
    setFormReady(false)
    setFormError(null)
  }

  function handleRoleChange(value: string) {
    const nextRole = value as AccountRole
    setRole(nextRole)
    setFormError(null)
    if (nextRole !== 'orang_tua') setStudentIds([])
    if (nextRole !== 'petugas_keuangan') setCategoryCodes([])
    if (nextRole === 'siswa' || nextRole === 'guru') {
      if (!classId && classes[0]) setClassId(String(classes[0].id))
    } else {
      setClassId('')
    }
    if (nextRole !== 'siswa') setAdmissionYear('')
    else if (!admissionYear) setAdmissionYear(String(currentYear))
    if (nextRole !== 'guru') setTeacherType('guru_kelas')
  }

  function validateForm() {
    if (needsClass && !classes.some((item) => String(item.id) === classId)) {
      return 'Pilih kelas aktif untuk akun ini.'
    }
    if (
      role === 'guru' &&
      teacherType === 'guru_mapel' &&
      classId
    ) {
      return 'Guru mata pelajaran tidak ditempatkan pada satu kelas.'
    }
    if (
      role === 'siswa' &&
      (!Number.isInteger(Number(admissionYear)) ||
        Number(admissionYear) < 2000 ||
        Number(admissionYear) > currentYear + 5)
    ) {
      return 'Pilih tahun angkatan yang valid.'
    }
    if (
      role === 'orang_tua' &&
      (!studentIds.length || studentIds.length > 20)
    ) {
      return 'Pilih satu sampai dua puluh siswa aktif untuk akun orang tua.'
    }
    if (role === 'petugas_keuangan' && !categoryCodes.length) {
      return 'Pilih setidaknya satu kategori pembayaran untuk petugas.'
    }
    return null
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!editingAccount || isSaving || !formReady) return

    const validationError = validateForm()
    if (validationError) {
      setFormError(validationError)
      return
    }

    setIsSaving(true)
    setFormError(null)
    try {
      const result = await updateManagedAccount({
        userId: editingAccount.id,
        nomorInduk: studentNumber,
        namaLengkap: name,
        email,
        role,
        jenisGuru: role === 'guru' ? teacherType : null,
        kelasId: needsClass && classId ? Number(classId) : null,
        tahunAngkatan: role === 'siswa' ? Number(admissionYear) : null,
        studentUserIds: role === 'orang_tua' ? studentIds : [],
        categoryCodes:
          role === 'petugas_keuangan' ? categoryCodes : [],
        password: newPassword,
      })

      if (result.status === 'error') {
        await showFeedback(result)
        return
      }

      setEditingAccount(null)
      await showFeedback(result)
      router.refresh()
    } finally {
      setIsSaving(false)
    }
  }

  async function handleStatusChange(account: ManagedAccount) {
    if (account.id === currentAccountId) {
      await showFeedback({
        status: 'error',
        message: 'Akun admin yang sedang digunakan tidak dapat dinonaktifkan.',
      })
      return
    }

    const active = account.is_deleted !== 0
    const action = active ? 'aktifkan kembali' : 'nonaktifkan'
    const confirmation = await Swal.fire({
      icon: active ? 'question' : 'warning',
      title: active ? 'Aktifkan akun?' : 'Nonaktifkan akun?',
      text: `Yakin ingin ${action} akun ${account.nama_lengkap}? Riwayat data akan tetap tersimpan.`,
      showCancelButton: true,
      confirmButtonText: active ? 'Ya, aktifkan' : 'Ya, nonaktifkan',
      cancelButtonText: 'Batal',
      confirmButtonColor: active ? '#0f5132' : '#b42318',
      reverseButtons: true,
      focusCancel: true,
      customClass: {
        popup: 'rounded-2xl',
        confirmButton: `rounded-xl px-5 py-2.5 font-semibold text-white ${
          active ? 'bg-[#0f5132]' : 'bg-[#b42318]'
        }`,
        cancelButton:
          'rounded-xl border border-[#dce5df] bg-white px-5 py-2.5 font-semibold text-[#35463b]',
      },
      buttonsStyling: false,
    })
    if (!confirmation.isConfirmed) {
      return
    }

    setStatusChangingId(account.id)
    try {
      const result = await setManagedAccountStatus(account.id, active)
      await showFeedback(result)
      if (result.status === 'success') router.refresh()
    } finally {
      setStatusChangingId(null)
    }
  }

  function toggleStudent(studentId: number) {
    setStudentIds((current) =>
      current.includes(studentId)
        ? current.filter((id) => id !== studentId)
        : [...current, studentId],
    )
  }

  function toggleCategory(code: string) {
    setCategoryCodes((current) =>
      current.includes(code)
        ? current.filter((item) => item !== code)
        : [...current, code],
    )
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#0f6a42] dark:text-[#ffd166]">
            Administrasi
          </p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-[#1d2b23] dark:text-[#e8e5de]">
            Kelola Akun
          </h2>
          <p className="mt-2 text-sm leading-6 text-[#65736a] dark:text-[#c5c2ba]">
            Perbarui data dan akses akun warga sekolah. Penonaktifan menjaga
            riwayat tetap tersimpan.
          </p>
        </div>
        <div className="rounded-xl border border-[#e5ebe7] bg-white px-4 py-3 text-sm dark:border-[#616161] dark:bg-[#1c2d35]">
          <span className="text-[#718078] dark:text-[#c5c2ba]">Total akun</span>
          <span className="ml-2 font-bold text-[#26382e] dark:text-[#e8e5de]">
            {accounts.length.toLocaleString('id-ID')}
          </span>
        </div>
      </header>

      <section className="overflow-hidden rounded-2xl border border-[#e5ebe7] bg-white shadow-sm dark:border-[#616161] dark:bg-[#1c2d35]">
        <div className="grid gap-3 border-b border-[#e7ece8] p-4 dark:border-[#424242] sm:grid-cols-[minmax(0,1fr)_190px_170px] sm:px-5">
          <label className="relative">
            <span className="sr-only">Cari akun</span>
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#829087] dark:text-[#c5c2ba]"
              size={17}
            />
            <input
              className={`${fieldClassName} pl-10`}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari nama, nomor induk, email, kelas"
              type="search"
              value={query}
            />
          </label>
          <label>
            <span className="sr-only">Filter role</span>
            <select
              className={fieldClassName}
              onChange={(event) => setRoleFilter(event.target.value)}
              value={roleFilter}
            >
              <option value="all">Semua role</option>
              {roleOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="sr-only">Filter status</span>
            <select
              className={fieldClassName}
              onChange={(event) => setStatusFilter(event.target.value)}
              value={statusFilter}
            >
              <option value="active">Akun aktif</option>
              <option value="inactive">Akun nonaktif</option>
              <option value="all">Semua status</option>
            </select>
          </label>
        </div>

        {visibleAccounts.length ? (
          <ul className="divide-y divide-[#edf0ed] dark:divide-[#424242]">
            {visibleAccounts.map((account) => {
              const isSelf = account.id === currentAccountId
              const isActive = account.is_deleted === 0
              return (
                <li
                  className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:px-5"
                  key={account.id}
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#eaf3ed] text-[#0f5132] dark:bg-[#34434b] dark:text-[#ffd166]">
                    <UserRoundCog aria-hidden="true" size={19} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-bold text-[#26382e] dark:text-[#e8e5de]">
                        {account.nama_lengkap}
                      </p>
                      <span className="rounded-full bg-[#f0f3f1] px-2.5 py-0.5 text-[10px] font-semibold text-[#526158] dark:bg-[#34434b] dark:text-[#d0cec6]">
                        {roleLabel(account.role)}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                          isActive
                            ? 'bg-emerald-50 text-emerald-800 dark:bg-[#183b2c] dark:text-[#b9f4d0]'
                            : 'bg-red-50 text-red-800 dark:bg-red-950/30 dark:text-red-200'
                        }`}
                      >
                        {isActive ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-xs text-[#718078] dark:text-[#c5c2ba]">
                      {account.nomor_induk} · {account.email}
                      {account.kelas_nama ? ` · ${account.kelas_nama}` : ''}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-[#dce5df] px-3 text-xs font-semibold text-[#35463b] transition hover:bg-[#f7f9f7] disabled:opacity-50 dark:border-[#616161] dark:text-[#e8e5de] dark:hover:bg-[#34434b]"
                      disabled={!isActive || isSelf || statusChangingId === account.id}
                      onClick={() => void openEditor(account)}
                      type="button"
                    >
                      <Pencil aria-hidden="true" size={14} />
                      Edit
                    </button>
                    <button
                      className={`inline-flex min-h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-semibold transition disabled:opacity-50 ${
                        isActive
                          ? 'border-red-200 text-red-700 hover:bg-red-50 dark:border-red-900 dark:text-red-200 dark:hover:bg-red-950/30'
                          : 'border-emerald-200 text-emerald-800 hover:bg-emerald-50 dark:border-[#286345] dark:text-[#b9f4d0] dark:hover:bg-[#183b2c]'
                      }`}
                      disabled={isSelf || statusChangingId === account.id}
                      onClick={() => void handleStatusChange(account)}
                      type="button"
                    >
                      {isActive ? (
                        <UserRoundX aria-hidden="true" size={14} />
                      ) : (
                        <ShieldCheck aria-hidden="true" size={14} />
                      )}
                      {statusChangingId === account.id
                        ? 'Memproses…'
                        : isActive
                          ? 'Nonaktifkan'
                          : 'Aktifkan'}
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="px-5 py-12 text-center text-sm text-[#718078] dark:text-[#c5c2ba]">
            Tidak ada akun yang cocok dengan filter.
          </p>
        )}
      </section>

      {editingAccount ? (
        <div
          className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/50 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeEditor()
          }}
        >
          <section
            aria-labelledby="account-editor-title"
            aria-modal="true"
            className="my-auto max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-[#e5ebe7] bg-white shadow-xl dark:border-[#616161] dark:bg-[#1c2d35]"
            role="dialog"
          >
            <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-[#e7ece8] bg-white px-5 py-4 dark:border-[#424242] dark:bg-[#1c2d35]">
              <div>
                <h2
                  className="font-bold text-[#26382e] dark:text-[#e8e5de]"
                  id="account-editor-title"
                >
                  Kelola akun
                </h2>
                <p className="mt-1 text-xs text-[#718078] dark:text-[#c5c2ba]">
                  Perubahan role juga mengganti hak akses akun.
                </p>
              </div>
              <button
                aria-label="Tutup formulir"
                className="grid size-9 place-items-center rounded-lg text-[#718078] hover:bg-[#f2f5f3] disabled:opacity-50 dark:text-[#c5c2ba] dark:hover:bg-[#34434b]"
                disabled={isSaving}
                onClick={closeEditor}
                type="button"
              >
                ×
              </button>
            </header>

            {isLoadingConfig ? (
              <p className="p-8 text-center text-sm text-[#718078] dark:text-[#c5c2ba]">
                Memuat konfigurasi akses akun…
              </p>
            ) : formReady ? (
              <form className="space-y-5 p-5 sm:p-6" onSubmit={handleSave}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label>
                    <span className={labelClassName}>Role akun</span>
                    <select
                      className={fieldClassName}
                      onChange={(event) => handleRoleChange(event.target.value)}
                      value={role}
                    >
                      {roleOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span className={labelClassName}>
                      {roleIdentityLabel(role)}
                    </span>
                    <input
                      className={fieldClassName}
                      maxLength={50}
                      onChange={(event) =>
                        setStudentNumber(event.target.value)
                      }
                      required
                      value={studentNumber}
                    />
                  </label>
                  <label>
                    <span className={labelClassName}>Nama lengkap</span>
                    <input
                      className={fieldClassName}
                      maxLength={100}
                      onChange={(event) => setName(event.target.value)}
                      required
                      value={name}
                    />
                  </label>
                  <label>
                    <span className={labelClassName}>Alamat email</span>
                    <input
                      autoCapitalize="none"
                      autoComplete="email"
                      className={fieldClassName}
                      maxLength={100}
                      onChange={(event) => setEmail(event.target.value)}
                      required
                      type="email"
                      value={email}
                    />
                  </label>
                </div>

                {role === 'guru' ? (
                  <label className="block max-w-sm">
                    <span className={labelClassName}>Jenis guru</span>
                    <select
                      className={fieldClassName}
                      onChange={(event) => {
                        const nextTeacherType = event.target.value as
                          | 'guru_kelas'
                          | 'guru_mapel'
                        setTeacherType(nextTeacherType)
                        setClassId(
                          nextTeacherType === 'guru_kelas'
                            ? String(classes[0]?.id ?? '')
                            : '',
                        )
                      }}
                      value={teacherType}
                    >
                      <option value="guru_kelas">Guru kelas</option>
                      <option value="guru_mapel">Guru mata pelajaran</option>
                    </select>
                  </label>
                ) : null}

                {needsClass ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {role !== 'guru' || teacherType === 'guru_kelas' ? (
                      <label>
                        <span className={labelClassName}>Kelas</span>
                        <select
                          className={fieldClassName}
                          onChange={(event) => setClassId(event.target.value)}
                          required
                          value={classId}
                        >
                          <option value="">Pilih kelas</option>
                          {classes.map((schoolClass) => (
                            <option key={schoolClass.id} value={schoolClass.id}>
                              {schoolClass.nama}
                            </option>
                          ))}
                        </select>
                      </label>
                    ) : null}
                    {role === 'siswa' ? (
                      <label>
                        <span className={labelClassName}>Tahun angkatan</span>
                        <input
                          className={fieldClassName}
                          max={currentYear + 5}
                          min={2000}
                          onChange={(event) =>
                            setAdmissionYear(event.target.value)
                          }
                          required
                          type="number"
                          value={admissionYear}
                        />
                      </label>
                    ) : null}
                  </div>
                ) : null}

                {role === 'orang_tua' ? (
                  <fieldset>
                    <legend className={labelClassName}>
                      Anak yang dapat diakses (pilih 1–20)
                    </legend>
                    {students.length ? (
                      <div className="max-h-48 overflow-y-auto rounded-xl border border-[#e5ebe7] p-2 dark:border-[#616161]">
                        {students.map((student) => (
                          <label
                            className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm text-[#35463b] hover:bg-[#f7f9f7] dark:text-[#e8e5de] dark:hover:bg-[#34434b]"
                            key={student.id}
                          >
                            <input
                              checked={studentIds.includes(student.id)}
                              onChange={() => toggleStudent(student.id)}
                              type="checkbox"
                            />
                            <span className="min-w-0 flex-1 truncate">
                              {student.nama_lengkap}
                            </span>
                            <span className="text-xs text-[#718078] dark:text-[#c5c2ba]">
                              {student.kelas_nama ?? student.nomor_induk}
                            </span>
                          </label>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-amber-800 dark:text-[#ffe0a3]">
                        Belum ada siswa aktif untuk ditautkan.
                      </p>
                    )}
                  </fieldset>
                ) : null}

                {role === 'petugas_keuangan' ? (
                  <fieldset>
                    <legend className={labelClassName}>
                      Kategori pembayaran yang dikelola
                    </legend>
                    <div className="flex flex-wrap gap-2">
                      {paymentCategories.map((category) => (
                        <label
                          className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-[#e5ebe7] px-3 text-sm text-[#35463b] dark:border-[#616161] dark:text-[#e8e5de]"
                          key={category.code}
                        >
                          <input
                            checked={categoryCodes.includes(category.code)}
                            onChange={() => toggleCategory(category.code)}
                            type="checkbox"
                          />
                          {category.name}
                        </label>
                      ))}
                    </div>
                  </fieldset>
                ) : null}

                <label className="block">
                  <span className={labelClassName}>
                    Kata sandi baru{' '}
                    <span className="font-normal text-[#718078]">
                      (opsional; minimal 6 karakter)
                    </span>
                  </span>
                  <span className="relative block">
                    <input
                      autoComplete="new-password"
                      className={`${fieldClassName} pr-11`}
                      minLength={6}
                      onChange={(event) => setNewPassword(event.target.value)}
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                    />
                    <button
                      aria-label={
                        showPassword
                          ? 'Sembunyikan kata sandi baru'
                          : 'Tampilkan kata sandi baru'
                      }
                      className="absolute inset-y-0 right-0 grid w-11 place-items-center text-[#718078] dark:text-[#c5c2ba]"
                      onClick={() => setShowPassword((visible) => !visible)}
                      type="button"
                    >
                      {showPassword ? (
                        <EyeOff aria-hidden="true" size={18} />
                      ) : (
                        <Eye aria-hidden="true" size={18} />
                      )}
                    </button>
                  </span>
                  <span className="mt-1 flex items-center gap-1.5 text-[11px] text-[#718078] dark:text-[#c5c2ba]">
                    <KeyRound aria-hidden="true" size={13} />
                    Kosongkan jika tidak ingin mengganti kata sandi.
                  </span>
                </label>

                {formError ? (
                  <p
                    className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-900 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200"
                    role="alert"
                  >
                    {formError}
                  </p>
                ) : null}

                <div className="flex flex-col-reverse justify-end gap-2 border-t border-[#e7ece8] pt-4 dark:border-[#424242] sm:flex-row">
                  <button
                    className="min-h-11 rounded-xl border border-[#dce5df] px-4 text-sm font-semibold text-[#35463b] dark:border-[#616161] dark:text-[#e8e5de]"
                    disabled={isSaving}
                    onClick={closeEditor}
                    type="button"
                  >
                    Batal
                  </button>
                  <button
                    className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#0f5132] px-5 text-sm font-bold text-white disabled:cursor-wait disabled:opacity-60 dark:bg-[#ffd166] dark:text-[#172027]"
                    disabled={isSaving}
                    type="submit"
                  >
                    {isSaving ? 'Menyimpan…' : 'Simpan perubahan'}
                  </button>
                </div>
              </form>
            ) : (
              <p className="p-8 text-center text-sm text-red-800 dark:text-red-200">
                {formError}
              </p>
            )}
          </section>
        </div>
      ) : null}
    </div>
  )
}
