import { createClient } from '@/lib/supabase/client'

type IdentifierSession = {
  access_token?: unknown
  refresh_token?: unknown
  message?: unknown
}

export async function signIn(identifier: string, password: string) {
  const normalizedIdentifier = identifier.trim()
  if (!normalizedIdentifier || !password) {
    throw new Error('Masukkan nomor induk atau email dan kata sandi.')
  }

  const supabase = createClient()

  if (normalizedIdentifier.includes('@')) {
    const { error } = await supabase.auth.signInWithPassword({
      email: normalizedIdentifier.toLowerCase(),
      password,
    })

    if (error) {
      throw new Error(
        'Login gagal. Periksa nomor induk atau email dan kata sandi Anda.',
      )
    }
  } else {
    const { data, error } = await supabase.functions.invoke(
      'login-by-identifier',
      {
        body: { identifier: normalizedIdentifier, password },
      },
    )
    const session = data as IdentifierSession | null

    if (
      error ||
      typeof session?.access_token !== 'string' ||
      typeof session.refresh_token !== 'string'
    ) {
      throw new Error(
        typeof session?.message === 'string'
          ? session.message
          : 'Login dengan nomor induk gagal. Periksa kembali data Anda.',
      )
    }

    const { error: sessionError } = await supabase.auth.setSession({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
    })

    if (sessionError) {
      throw new Error(
        'Login gagal. Periksa nomor induk atau email dan kata sandi Anda.',
      )
    }
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    await supabase.auth.signOut()
    throw new Error('Sesi login belum dapat diverifikasi. Silakan coba lagi.')
  }

  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('id, role')
    .eq('auth_user_id', user.id)
    .eq('is_deleted', 0)
    .maybeSingle()

  if (profileError) {
    await supabase.auth.signOut()
    throw new Error('Profil sekolah belum dapat dimuat. Silakan coba lagi.')
  }

  if (!profile) {
    await supabase.auth.signOut()
    throw new Error(
      'Profil sekolah Anda tidak aktif. Hubungi administrator sekolah.',
    )
  }

  return profile
}
