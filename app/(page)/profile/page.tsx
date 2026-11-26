import { redirect } from 'next/navigation'
import { connection } from 'next/server'

import ProfileView from '@/components/profile/profile-view'
import { getPortalRoleLabel } from '@/lib/portal/navigation'
import { getCurrentProfile } from '@/lib/services/auth/auth-server-service'
import { createClient } from '@/lib/supabase/server'

export default async function ProfilePage() {
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

  let className: string | null = null
  let classError: string | null = null
  if (profileResult.profile.kelas_id !== null) {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('kelas')
      .select('nama')
      .eq('id', profileResult.profile.kelas_id)
      .maybeSingle()

    if (error) {
      classError = 'Informasi kelas belum dapat dimuat.'
    } else {
      className = data?.nama ?? null
    }
  }

  return (
    <ProfileView
      classError={classError}
      className={className}
      profile={{
        email: profileResult.profile.email,
        jenisGuru: profileResult.profile.jenis_guru,
        namaLengkap: profileResult.profile.nama_lengkap,
        nomorInduk: profileResult.profile.nomor_induk,
        role: getPortalRoleLabel(profileResult.profile.role),
        tahunAngkatan: profileResult.profile.tahun_angkatan,
      }}
    />
  )
}