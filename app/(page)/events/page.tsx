import { redirect } from 'next/navigation'
import { connection } from 'next/server'

import EventBoard from '@/components/events/event-board'
import { getCurrentProfile } from '@/lib/services/auth/auth-server-service'
import { getEventsPageData } from '@/lib/services/events/event-service'

export default async function EventsPage() {
  await connection()
  const profileResult = await getCurrentProfile()

  if (profileResult.status === 'unauthenticated') redirect('/login')
  if (profileResult.status !== 'authenticated') {
    return (
      <p
        className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-6 text-amber-900"
        role="alert"
      >
        Profil sekolah tidak dapat dimuat. Periksa koneksi dan kebijakan akses.
      </p>
    )
  }

  const role = profileResult.profile.role.trim().toLowerCase()
  const canManage = role === 'admin' || role === 'guru'
  const result = await getEventsPageData(canManage)

  if (result.status === 'error') {
    return (
      <p
        className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-6 text-amber-900"
        role="alert"
      >
        {result.message}
      </p>
    )
  }

  const initialDate = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())

  return (
    <EventBoard
      canManage={canManage}
      classes={result.data.classes}
      events={result.data.events}
      imageWarning={result.data.imageWarning}
      initialDate={initialDate}
      role={role}
      userName={profileResult.profile.nama_lengkap}
    />
  )
}