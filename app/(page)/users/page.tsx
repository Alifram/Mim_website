import { redirect } from 'next/navigation'
import { connection } from 'next/server'

import AccountManagement from '@/components/users/account-management'
import { getCurrentProfile } from '@/lib/services/auth/auth-server-service'
import { getAccountManagementData } from '@/lib/services/users/account-management-service'

export default async function UsersPage() {
  await connection()
  const profileResult = await getCurrentProfile()

  if (profileResult.status === 'unauthenticated') redirect('/login')
  if (profileResult.status !== 'authenticated') {
    return <UsersMessage>Profil sekolah tidak dapat dimuat.</UsersMessage>
  }
  if (profileResult.profile.role.trim().toLowerCase() !== 'admin') {
    return (
      <UsersMessage>
        Pengelolaan akun hanya dapat diakses oleh administrator sekolah.
      </UsersMessage>
    )
  }

  const result = await getAccountManagementData()
  if (result.status === 'error') {
    return <UsersMessage>{result.message}</UsersMessage>
  }

  return (
    <AccountManagement
      accounts={result.data.accounts}
      classes={result.data.classes}
      currentAccountId={profileResult.profile.id}
      currentYear={new Date().getFullYear()}
      paymentCategories={result.data.paymentCategories}
    />
  )
}

function UsersMessage({ children }: { children: string }) {
  return (
    <p
      className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-6 text-amber-900 dark:border-[#795d23] dark:bg-[#3b3020] dark:text-[#ffe0a3]"
      role="alert"
    >
      {children}
    </p>
  )
}