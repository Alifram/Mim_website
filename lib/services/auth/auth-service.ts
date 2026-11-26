import { createClient } from '@/lib/supabase/client'

type IdentifierSession = {
  access_token?: unknown
  refresh_token?: unknown
  message?: unknown
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
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
      const authErrorMessage = error.message.toLowerCase()
      const authErrorCode = 'code' in error && typeof error.code === 'string'
        ? error.code.toLowerCase()
        : ''
      if (
        authErrorCode.includes('banned') ||
        authErrorMessage.includes('banned') ||
        authErrorMessage.includes('user is disabled') ||
        authErrorMessage.includes('user disabled')
      ) {
        throw new Error(
          'Akun Anda dinonaktifkan. Hubungi admin sekolah untuk bantuan.',
        )
      }
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
      let message = typeof session?.message === 'string'
        ? session.message
        : null
      if (error && 'context' in error && error.context instanceof Response) {
        try {
          const responseBody: unknown = await error.context.clone().json()
          if (isRecord(responseBody) && typeof responseBody.message === 'string') {
            message = responseBody.message
          }
        } catch {
          message = typeof session?.message === 'string'
            ? session.message
            : null
        }
      }
      throw new Error(
        message ?? 'Login dengan nomor induk gagal. Periksa kembali data Anda.',
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
    .select('id, role, is_deleted')
    .eq('auth_user_id', user.id)
    .maybeSingle()

  if (profileError) {
    await supabase.auth.signOut()
    throw new Error('Profil sekolah belum dapat dimuat. Silakan coba lagi.')
  }

  if (!profile) {
    await supabase.auth.signOut()
    throw new Error(
      'Profil akun Anda belum terhubung. Hubungi admin sekolah untuk bantuan.',
    )
  }
  if (Number(profile.is_deleted) === 1) {
    await supabase.auth.signOut()
    throw new Error(
      'Akun Anda dinonaktifkan. Hubungi admin sekolah untuk bantuan.',
    )
  }

  return profile
}
