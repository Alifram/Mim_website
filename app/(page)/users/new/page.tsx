import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { connection } from 'next/server'

import RegistrationForm from '@/components/users/registration-form'
import { getCurrentProfile } from '@/lib/services/auth/auth-server-service'
import { getRegistrationOptions } from '@/lib/services/users/registration-options-service'

export default function NewUserPage() {
  return (
    <Suspense fallback={<RegistrationFallback />}>
      <RegistrationContent />
    </Suspense>
  )
}

async function RegistrationContent() {
  await connection()
  const profileResult = await getCurrentProfile()

  if (profileResult.status === 'unauthenticated') {
    redirect('/login')
  }
  if (profileResult.status !== 'authenticated') {
    return (
      <RegistrationMessage>
        Profil sekolah tidak dapat dimuat. Periksa koneksi dan kebijakan akses.
      </RegistrationMessage>
    )
  }
  if (profileResult.profile.role.trim().toLowerCase() !== 'admin') {
    return (
      <RegistrationMessage>
        Registrasi akun hanya dapat dilakukan oleh administrator sekolah.
      </RegistrationMessage>
    )
  }

  const options = await getRegistrationOptions()

  return (
    <RegistrationForm
      classError={options.classError}
      classes={options.classes}
      currentYear={new Date().getFullYear()}
      studentError={options.studentError}
      students={options.students}
    />
  )
}

function RegistrationMessage({ children }: { children: string }) {
  return (
    <p
      className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-6 text-amber-900 dark:border-[#795d23] dark:bg-[#3b3020] dark:text-[#ffe0a3]"
      role="alert"
    >
      {children}
    </p>
  )
}

function RegistrationFallback() {
  return (
    <div
      aria-busy="true"
      className="rounded-2xl border border-[#e5ebe7] bg-white p-6 text-sm text-[#65736a] dark:border-[#616161] dark:bg-[#1c2d35] dark:text-[#c5c2ba]"
      role="status"
    >
      Memuat formulir registrasi…
    </div>
  )
}
