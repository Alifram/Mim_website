'use client'

import { createClient } from '@/lib/supabase/client'

export type RegistrationRole =
  | 'siswa'
  | 'guru'
  | 'orang_tua'
  | 'petugas_keuangan'

export type RegistrationPayload = {
  nomor_induk: string
  nama_lengkap: string
  email: string
  password: string
  role: RegistrationRole
  jenis_guru: 'guru_kelas' | 'guru_mapel' | null
  kelas_id: number | null
  tahun_angkatan: number | null
}

export type RegistrationResult =
  | { status: 'success' | 'partial'; message: string }
  | { status: 'error'; message: string }

const genericRegistrationError =
  'Pendaftaran gagal. Periksa koneksi dan pastikan layanan Supabase tersedia.'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

async function getEdgeFunctionErrorMessage(
  error: { context?: unknown },
  data: unknown,
) {
  if (isRecord(data) && typeof data.message === 'string') {
    return data.message
  }

  if (error.context instanceof Response) {
    try {
      const body: unknown = await error.context.clone().json()
      if (isRecord(body) && typeof body.message === 'string') {
        return body.message
      }
    } catch {
      return genericRegistrationError
    }
  }

  return genericRegistrationError
}

export async function registerSchoolAccount(
  payload: RegistrationPayload,
  linkedStudentIds: number[],
  paymentCategoryCodes: string[],
): Promise<RegistrationResult> {
  const supabase = createClient()
  const { data, error } = await supabase.functions.invoke(
    'admin-create-user',
    { body: payload },
  )

  if (error) {
    return {
      status: 'error',
      message: await getEdgeFunctionErrorMessage(error, data),
    }
  }

  if (!isRecord(data) || !Number.isSafeInteger(data.profile_id)) {
    return {
      status: 'error',
      message:
        'Respons pendaftaran tidak valid. Periksa daftar pengguna sebelum mencoba lagi.',
    }
  }

  if (
    payload.role !== 'orang_tua' &&
    payload.role !== 'petugas_keuangan'
  ) {
    return {
      status: 'success',
      message:
        typeof data.message === 'string'
          ? data.message
          : 'Akun dan profil berhasil dibuat.',
    }
  }

  try {
    const { data: configuration, error: configurationError } =
      await supabase.rpc('admin_configure_payment_account', {
        p_user_id: data.profile_id,
        p_student_user_ids:
          payload.role === 'orang_tua' ? linkedStudentIds : [],
        p_category_codes:
          payload.role === 'petugas_keuangan' ? paymentCategoryCodes : [],
      })

    if (
      configurationError ||
      !isRecord(configuration) ||
      configuration.status !== 'success'
    ) {
      return {
        status: 'partial',
        message:
          'Akun berhasil dibuat, tetapi pengaturan akses belum selesai. Periksa konfigurasi akun sebelum mendaftarkannya kembali.',
      }
    }

    return {
      status: 'success',
      message:
        typeof configuration.message === 'string'
          ? configuration.message
          : 'Akun dan pengaturan akses berhasil dibuat.',
    }
  } catch {
    return {
      status: 'partial',
      message:
        'Akun berhasil dibuat, tetapi status pengaturan akses belum dapat dipastikan. Periksa konfigurasi akun sebelum mendaftarkannya kembali.',
    }
  }
}
