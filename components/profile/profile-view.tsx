'use client'

import { useState, type FormEvent } from 'react'
import {
  BadgeCheck,
  BriefcaseBusiness,
  Eye,
  EyeOff,
  GraduationCap,
  KeyRound,
  Mail,
  ShieldCheck,
  UserRound,
} from 'lucide-react'

import { logout } from '@/lib/services/auth/auth-actions'
import { createClient } from '@/lib/supabase/client'

type ProfileViewProps = {
  classError: string | null
  className: string | null
  profile: {
    email: string
    jenisGuru: string | null
    namaLengkap: string
    nomorInduk: string
    role: string
    tahunAngkatan: number | null
  }
}

type Feedback = {
  status: 'success' | 'error'
  message: string
}

const fieldClassName =
  'min-h-11 w-full rounded-xl border border-[#dce5df] bg-white px-3.5 text-sm text-[#26382e] outline-none transition focus:border-[#0f5132] focus:ring-2 focus:ring-[#0f5132]/10 disabled:opacity-60 dark:border-[#616161] dark:bg-[#111b21] dark:text-[#e8e5de] dark:focus:border-[#ffd166]'

function InfoCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof UserRound
  label: string
  value: string
}) {
  return (
    <div className="flex items-start gap-3 p-4 sm:p-5">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#eaf3ed] text-[#0f5132] dark:bg-[#34434b] dark:text-[#ffd166]">
        <Icon aria-hidden="true" size={18} />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-medium text-[#718078] dark:text-[#c5c2ba]">
          {label}
        </p>
        <p className="mt-1 break-words text-sm font-semibold text-[#26382e] dark:text-[#e8e5de]">
          {value || '—'}
        </p>
      </div>
    </div>
  )
}

function PasswordField({
  autoComplete,
  disabled,
  id,
  label,
  minLength,
  onChange,
  value,
  labelClassName = 'mb-1.5 block',
}: {
  autoComplete: string
  disabled: boolean
  id: string
  label: string
  minLength?: number
  onChange: (value: string) => void
  value: string
  labelClassName?: string
}) {
  const [visible, setVisible] = useState(false)

  return (
    <>
      <label
        className={`${labelClassName} text-xs font-semibold text-[#35463b] dark:text-[#e8e5de]`}
        htmlFor={id}
      >
        {label}
      </label>
      <div className="relative">
        <input
          autoComplete={autoComplete}
          className={`${fieldClassName} pr-11`}
          disabled={disabled}
          id={id}
          minLength={minLength}
          onChange={(event) => onChange(event.target.value)}
          required
          type={visible ? 'text' : 'password'}
          value={value}
        />
        <button
          aria-label={visible ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
          aria-pressed={visible}
          className="absolute inset-y-0 right-0 grid w-11 place-items-center rounded-r-xl text-[#718078] transition hover:text-[#0f5132] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0f5132]/30 disabled:opacity-60 dark:text-[#c5c2ba] dark:hover:text-[#ffd166] dark:focus-visible:ring-[#ffd166]/40"
          disabled={disabled}
          onClick={() => setVisible((current) => !current)}
          type="button"
        >
          {visible ? (
            <EyeOff aria-hidden="true" size={18} />
          ) : (
            <Eye aria-hidden="true" size={18} />
          )}
        </button>
      </div>
    </>
  )
}

export default function ProfileView({
  classError,
  className,
  profile,
}: ProfileViewProps) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [feedback, setFeedback] = useState<Feedback | null>(null)

  async function handlePasswordChange(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isSubmitting) return

    if (newPassword.length < 6) {
      setFeedback({
        status: 'error',
        message: 'Kata sandi baru minimal 6 karakter.',
      })
      return
    }
    if (newPassword !== confirmPassword) {
      setFeedback({
        status: 'error',
        message: 'Konfirmasi kata sandi baru belum sama.',
      })
      return
    }
    if (currentPassword === newPassword) {
      setFeedback({
        status: 'error',
        message: 'Kata sandi baru harus berbeda dari kata sandi saat ini.',
      })
      return
    }

    setIsSubmitting(true)
    setFeedback(null)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
        current_password: currentPassword,
      })

      if (error) {
        const message = error.message.toLowerCase()
        setFeedback({
          status: 'error',
          message:
            message.includes('current password') ||
            message.includes('invalid login credentials')
              ? 'Kata sandi saat ini tidak sesuai.'
              : 'Kata sandi belum berhasil diperbarui. Periksa kembali lalu coba lagi.',
        })
        return
      }

      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setFeedback({
        status: 'success',
        message: 'Kata sandi berhasil diperbarui.',
      })
    } catch {
      setFeedback({
        status: 'error',
        message: 'Kata sandi belum berhasil diperbarui. Periksa koneksi lalu coba lagi.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const teacherType =
    profile.jenisGuru?.replaceAll('_', ' ').replace(/\b\w/g, (letter) =>
      letter.toUpperCase(),
    ) ?? '—'
  const initial = profile.namaLengkap.trim().charAt(0).toUpperCase() || 'A'

  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0f5132] to-[#24734b] p-5 text-white shadow-sm sm:p-7">
        <div
          aria-hidden="true"
          className="absolute -right-10 -top-20 size-64 rounded-full border border-white/10"
        />
        <div className="relative flex items-center gap-4 sm:gap-5">
          <span className="grid size-16 shrink-0 place-items-center rounded-full bg-white/15 text-3xl font-bold text-white ring-1 ring-white/20 sm:size-20">
            {initial}
          </span>
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-white/70">
              Profil Pengguna
            </p>
            <h2 className="mt-1 truncate text-2xl font-bold tracking-tight sm:text-3xl">
              {profile.namaLengkap}
            </h2>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wide">
                {profile.role}
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs text-white/80">
                <BadgeCheck aria-hidden="true" size={15} />
                Akun aktif
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-[#e5ebe7] bg-white shadow-sm dark:border-[#616161] dark:bg-[#1c2d35]">
        <div className="border-b border-[#e7ece8] px-4 py-4 dark:border-[#424242] sm:px-5">
          <h3 className="font-bold text-[#26382e] dark:text-[#e8e5de]">
            Informasi akun
          </h3>
          <p className="mt-1 text-xs text-[#718078] dark:text-[#c5c2ba]">
            Data identitas akun sekolah Anda.
          </p>
        </div>
        <div className="grid divide-y divide-[#edf0ed] sm:grid-cols-2 sm:divide-x sm:divide-y-0 dark:divide-[#424242]">
          <InfoCard
            icon={UserRound}
            label="Nama lengkap"
            value={profile.namaLengkap}
          />
          <InfoCard
            icon={ShieldCheck}
            label="Nomor induk"
            value={profile.nomorInduk}
          />
          <InfoCard icon={Mail} label="Alamat email" value={profile.email} />
          {classError ? (
            <InfoCard icon={GraduationCap} label="Kelas" value={classError} />
          ) : className ? (
            <InfoCard icon={GraduationCap} label="Kelas" value={className} />
          ) : profile.tahunAngkatan ? (
            <InfoCard
              icon={GraduationCap}
              label="Tahun angkatan"
              value={String(profile.tahunAngkatan)}
            />
          ) : (
            <InfoCard
              icon={BriefcaseBusiness}
              label="Peran akun"
              value={profile.role}
            />
          )}
          {profile.jenisGuru ? (
            <InfoCard
              icon={BriefcaseBusiness}
              label="Jenis guru"
              value={teacherType}
            />
          ) : null}
          {profile.tahunAngkatan && className ? (
            <InfoCard
              icon={GraduationCap}
              label="Tahun angkatan"
              value={String(profile.tahunAngkatan)}
            />
          ) : null}
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(280px,0.9fr)]">
        <form
          className="rounded-2xl border border-[#e5ebe7] bg-white p-5 shadow-sm dark:border-[#616161] dark:bg-[#1c2d35] sm:p-6"
          onSubmit={handlePasswordChange}
        >
          <div className="mb-5 flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-[#eaf3ed] text-[#0f5132] dark:bg-[#34434b] dark:text-[#ffd166]">
              <KeyRound aria-hidden="true" size={18} />
            </span>
            <div>
              <h3 className="text-sm font-bold text-[#26382e] dark:text-[#e8e5de]">
                Ganti kata sandi
              </h3>
              <p className="mt-1 text-xs text-[#718078] dark:text-[#c5c2ba]">
                Masukkan kata sandi saat ini untuk mengamankan perubahan.
              </p>
            </div>
          </div>

          <PasswordField
            autoComplete="current-password"
            disabled={isSubmitting}
            id="current-password"
            label="Kata sandi saat ini"
            onChange={setCurrentPassword}
            value={currentPassword}
          />

          <PasswordField
            autoComplete="new-password"
            disabled={isSubmitting}
            id="new-password"
            label="Kata sandi baru"
            labelClassName="mb-1.5 mt-4 block"
            minLength={6}
            onChange={setNewPassword}
            value={newPassword}
          />

          <PasswordField
            autoComplete="new-password"
            disabled={isSubmitting}
            id="confirm-password"
            label="Konfirmasi kata sandi baru"
            labelClassName="mb-1.5 mt-4 block"
            minLength={6}
            onChange={setConfirmPassword}
            value={confirmPassword}
          />

          {feedback ? (
            <p
              className={`mt-4 rounded-xl border px-3.5 py-3 text-xs leading-5 ${
                feedback.status === 'success'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-[#286345] dark:bg-[#183b2c] dark:text-[#b9f4d0]'
                  : 'border-red-200 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200'
              }`}
              role={feedback.status === 'error' ? 'alert' : 'status'}
            >
              {feedback.message}
            </p>
          ) : null}

          <button
            className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-[#0f5132] px-4 text-sm font-bold text-white transition hover:bg-[#0b4229] disabled:cursor-wait disabled:opacity-60 dark:bg-[#ffd166] dark:text-[#172027]"
            disabled={
              isSubmitting ||
              !currentPassword ||
              !newPassword ||
              !confirmPassword
            }
            type="submit"
          >
            {isSubmitting ? 'Memperbarui…' : 'Perbarui kata sandi'}
          </button>
        </form>

        <aside className="flex flex-col justify-between rounded-2xl border border-[#e5ebe7] bg-white p-5 shadow-sm dark:border-[#616161] dark:bg-[#1c2d35] sm:p-6">
          <div>
            <div className="grid size-10 place-items-center rounded-xl bg-[#eaf3ed] text-[#0f5132] dark:bg-[#34434b] dark:text-[#ffd166]">
              <ShieldCheck aria-hidden="true" size={18} />
            </div>
            <h3 className="mt-4 text-sm font-bold text-[#26382e] dark:text-[#e8e5de]">
              Keamanan akun
            </h3>
            <p className="mt-2 text-sm leading-6 text-[#65736a] dark:text-[#c5c2ba]">
              Jangan bagikan kata sandi kepada orang lain. Data identitas akun
              dikelola oleh administrator sekolah.
            </p>
            <p className="mt-3 text-xs leading-5 text-[#718078] dark:text-[#c5c2ba]">
              Untuk mengubah nama, email, atau nomor induk, hubungi admin
              sekolah.
            </p>
          </div>
          <form action={logout} className="mt-6">
            <button
              className="min-h-11 w-full rounded-xl border border-red-200 bg-red-50 px-4 text-sm font-semibold text-red-700 transition hover:bg-red-100 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200 dark:hover:bg-red-950/50"
              type="submit"
            >
              Keluar dari akun
            </button>
          </form>
        </aside>
      </section>
    </div>
  )
}