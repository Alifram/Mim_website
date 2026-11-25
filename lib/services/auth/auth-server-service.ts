import { cache } from 'react'

import { createClient } from '@/lib/supabase/server'

export const getCurrentProfile = cache(async function getCurrentProfile() {
  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError) {
    return { status: 'error' as const }
  }
  if (!user) {
    return { status: 'unauthenticated' as const }
  }

  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('nama_lengkap, role')
    .eq('auth_user_id', user.id)
    .eq('is_deleted', 0)
    .maybeSingle()

  if (profileError) {
    return { status: 'error' as const }
  }
  if (!profile) {
    return { status: 'missing-profile' as const }
  }

  return { status: 'authenticated' as const, profile }
})

export async function signOut() {
  const supabase = await createClient()
  const { error } = await supabase.auth.signOut()

  if (error) {
    throw new Error('Gagal keluar dari akun. Silakan coba lagi.')
  }
}
