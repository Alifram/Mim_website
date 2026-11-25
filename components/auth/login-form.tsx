'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Eye, EyeOff, LockKeyhole, UserRound } from 'lucide-react'

import { signIn } from '@/lib/services/auth/auth-service'

export default function LoginForm() {
  const router = useRouter()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isLoading) return

    const normalizedIdentifier = identifier.trim()
    if (!normalizedIdentifier || !password) {
      setErrorMessage('Masukkan nomor induk atau email dan kata sandi.')
      return
    }

    setIsLoading(true)
    setErrorMessage('')

    try {
      await signIn(normalizedIdentifier, password)
      router.replace('/dashboard')
      router.refresh()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Terjadi kesalahan. Silakan coba lagi.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form className="flex flex-col" onSubmit={handleSubmit} noValidate>
      <label
        className="mb-2 text-xs font-bold text-[#26382e] dark:text-[#e8e5de]"
        htmlFor="identifier"
      >
        Nomor induk atau email
      </label>
      <div className="flex min-h-[52px] items-center gap-3 rounded-xl border border-[#dce5df] bg-white px-4 text-[#789083] transition focus-within:border-[#0f5132] focus-within:ring-[3px] focus-within:ring-[#0f5132]/10 dark:border-[#616161] dark:bg-[#1c2d35] dark:text-[#d8d5cd] dark:focus-within:border-[#ffd166] dark:focus-within:ring-[#ffd166]/10">
        <UserRound aria-hidden="true" size={18} />
        <input
          autoComplete="username"
          autoCapitalize="none"
          className="w-full min-w-0 border-0 bg-transparent text-[13px] text-[#202b25] outline-none placeholder:text-[#a0aca5] dark:text-[#e8e5de] dark:placeholder:text-[#aaa79f]"
          id="identifier"
          name="identifier"
          onChange={(event) => setIdentifier(event.target.value)}
          placeholder="Masukkan nomor induk atau email"
          required
          value={identifier}
        />
      </div>

      <label
        className="mb-2 mt-[22px] text-xs font-bold text-[#26382e] dark:text-[#e8e5de]"
        htmlFor="password"
      >
        Kata sandi
      </label>
      <div className="flex min-h-[52px] items-center gap-3 rounded-xl border border-[#dce5df] bg-white px-4 text-[#789083] transition focus-within:border-[#0f5132] focus-within:ring-[3px] focus-within:ring-[#0f5132]/10 dark:border-[#616161] dark:bg-[#1c2d35] dark:text-[#d8d5cd] dark:focus-within:border-[#ffd166] dark:focus-within:ring-[#ffd166]/10">
        <LockKeyhole aria-hidden="true" size={18} />
        <input
          autoComplete="current-password"
          className="w-full min-w-0 border-0 bg-transparent text-[13px] text-[#202b25] outline-none placeholder:text-[#a0aca5] dark:text-[#e8e5de] dark:placeholder:text-[#aaa79f]"
          id="password"
          name="password"
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Masukkan kata sandi"
          required
          type={showPassword ? 'text' : 'password'}
          value={password}
        />
        <button
          aria-label={
            showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'
          }
          className="grid shrink-0 place-items-center border-0 bg-transparent text-[#718078] hover:text-[#0f5132] dark:text-[#d8d5cd] dark:hover:text-[#ffd166]"
          onClick={() => setShowPassword((current) => !current)}
          type="button"
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>

      {errorMessage ? (
        <p
          className="mt-4 rounded-[10px] border border-[#f1c7c7] bg-[#fff6f6] px-3.5 py-3 text-xs leading-5 text-[#9c2c2c] dark:border-[#713c3c] dark:bg-[#351d22] dark:text-[#ffc5c5]"
          role="alert"
        >
          {errorMessage}
        </p>
      ) : null}

      <button
        className="mt-7 flex min-h-[52px] items-center justify-center gap-2.5 rounded-xl bg-[#0f5132] text-[13px] font-bold text-white shadow-lg shadow-[#0f5132]/15 transition hover:-translate-y-px hover:bg-[#0b4229] disabled:cursor-wait disabled:opacity-70 dark:bg-[#ffd166] dark:text-[#172027] dark:shadow-none dark:hover:bg-[#ffdc85]"
        disabled={isLoading}
        type="submit"
      >
        <span>{isLoading ? 'Sedang masuk…' : 'Masuk'}</span>
        <ArrowRight aria-hidden="true" size={18} />
      </button>
    </form>
  )
}
