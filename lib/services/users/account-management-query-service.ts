'use client'

import { createClient } from '@/lib/supabase/client'

export type AccountConfiguration = {
  studentUserIds: number[]
  categoryCodes: string[]
}

export type AccountMutationResult =
  | { status: 'success'; message: string }
  | { status: 'error'; message: string }

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export async function fetchAccountConfiguration(
  userId: number,
): Promise<
  | { status: 'success'; config: AccountConfiguration }
  | { status: 'error'; message: string }
> {
  if (!Number.isSafeInteger(userId) || userId <= 0) {
    return { status: 'error', message: 'ID akun tidak valid.' }
  }

  try {
    const supabase = createClient()
    const { data, error } = await supabase.rpc('admin_get_account_config', {
      p_user_id: userId,
    })
    if (error) {
      return {
        status: 'error',
        message:
          error.code === '42501'
            ? 'Konfigurasi akun hanya dapat dilihat admin.'
            : 'Konfigurasi akun belum dapat dimuat. Pastikan migrasi manajemen akun sudah diterapkan.',
      }
    }

    if (
      !isRecord(data) ||
      data.status !== 'success' ||
      !Array.isArray(data.student_user_ids) ||
      !data.student_user_ids.every(
        (id) =>
          (typeof id === 'number' && Number.isSafeInteger(id) && id > 0) ||
          (typeof id === 'string' && /^[1-9]\d*$/.test(id)),
      ) ||
      !Array.isArray(data.category_codes) ||
      !data.category_codes.every(
        (code) => typeof code === 'string' && code.length > 0,
      )
    ) {
      return {
        status: 'error',
        message: 'Format konfigurasi akun dari server tidak valid.',
      }
    }

    return {
      status: 'success',
      config: {
        studentUserIds: data.student_user_ids.map(Number),
        categoryCodes: data.category_codes,
      },
    }
  } catch {
    return {
      status: 'error',
      message: 'Konfigurasi akun belum dapat dimuat. Periksa koneksi lalu coba lagi.',
    }
  }
}

export async function updateManagedAccount(input: {
  userId: number
  nomorInduk: string
  namaLengkap: string
  email: string
  role: string
  jenisGuru: string | null
  kelasId: number | null
  tahunAngkatan: number | null
  studentUserIds: number[]
  categoryCodes: string[]
  password: string
}): Promise<AccountMutationResult> {
  const studentNumber = input.nomorInduk.trim()
  const name = input.namaLengkap.trim()
  const email = input.email.trim().toLowerCase()

  if (
    !Number.isSafeInteger(input.userId) ||
    input.userId <= 0 ||
    !studentNumber ||
    studentNumber.length > 50 ||
    !name ||
    name.length > 100 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    email.length > 100 ||
    (input.password.length > 0 &&
      (input.password.length < 6 || input.password.length > 128))
  ) {
    return {
      status: 'error',
      message: 'Periksa kembali nama, nomor induk, email, dan kata sandi.',
    }
  }

  try {
    const supabase = createClient()
    const { data, error } = await supabase.functions.invoke(
      'admin-manage-user',
      {
        body: {
          action: 'update',
          user_id: input.userId,
          nomor_induk: studentNumber,
          nama_lengkap: name,
          email,
          role: input.role,
          jenis_guru: input.jenisGuru,
          kelas_id: input.kelasId,
          tahun_angkatan: input.tahunAngkatan,
          student_user_ids: input.studentUserIds,
          category_codes: input.categoryCodes,
          password_baru: input.password,
        },
      },
    )

    if (error) {
      let message =
        isRecord(data) && typeof data.message === 'string'
          ? data.message
          : null
      if (!message && error.context instanceof Response) {
        try {
          const responseBody: unknown = await error.context.clone().json()
          if (isRecord(responseBody) && typeof responseBody.message === 'string') {
            message = responseBody.message
          }
        } catch {
          message = null
        }
      }
      return {
        status: 'error',
        message: message ?? 'Data akun belum berhasil diperbarui. Periksa layanan Supabase.',
      }
    }
    if (!isRecord(data) || data.status !== 'success') {
      return {
        status: 'error',
        message: 'Server tidak mengonfirmasi perubahan akun.',
      }
    }

    return {
      status: 'success',
      message:
        typeof data.message === 'string'
          ? data.message
          : 'Data akun berhasil diperbarui.',
    }
  } catch {
    return {
      status: 'error',
      message: 'Data akun belum berhasil diperbarui. Periksa koneksi lalu coba lagi.',
    }
  }
}

export async function setManagedAccountStatus(
  userId: number,
  active: boolean,
): Promise<AccountMutationResult> {
  if (!Number.isSafeInteger(userId) || userId <= 0) {
    return { status: 'error', message: 'ID akun tidak valid.' }
  }

  try {
    const supabase = createClient()
    const { data, error } = await supabase.functions.invoke(
      'admin-manage-user',
      {
        body: {
          action: 'set_status',
          user_id: userId,
          status: active ? 0 : 1,
        },
      },
    )

    if (error) {
      return {
        status: 'error',
        message:
          (isRecord(data) && typeof data.message === 'string'
            ? data.message
            : null) ??
          'Status akun belum berhasil diperbarui. Periksa layanan Supabase.',
      }
    }
    if (!isRecord(data) || data.status !== 'success') {
      return {
        status: 'error',
        message: 'Server tidak mengonfirmasi perubahan status akun.',
      }
    }

    return {
      status: 'success',
      message:
        typeof data.message === 'string'
          ? data.message
          : active
            ? 'Akun berhasil diaktifkan kembali.'
            : 'Akun berhasil dinonaktifkan.',
    }
  } catch {
    return {
      status: 'error',
      message: 'Status akun belum berhasil diperbarui. Periksa koneksi lalu coba lagi.',
    }
  }
}
