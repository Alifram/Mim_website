'use client'

import { createClient } from '@/lib/supabase/client'

import {
  parseSchoolEventComments,
  type SchoolEventComment,
} from './event-types'

export type EventMutationResult =
  | { status: 'success'; message: string }
  | { status: 'error'; message: string }

export type EventCommentsResult =
  | { status: 'success'; comments: SchoolEventComment[] }
  | { status: 'error'; message: string }

function isSuccessResponse(value: unknown): boolean {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    'status' in value &&
    value.status === 'success'
  )
}

function validateEventInput(
  title: string,
  description: string,
  allClasses: boolean,
  classIds: number[],
  eventDate: string,
): string | null {
  const dateIsValid =
    /^\d{4}-\d{2}-\d{2}$/.test(eventDate) &&
    !Number.isNaN(Date.parse(`${eventDate}T00:00:00Z`)) &&
    new Date(`${eventDate}T00:00:00Z`).toISOString().slice(0, 10) === eventDate

  if (
    !title.trim() ||
    title.trim().length > 150 ||
    !description.trim() ||
    !dateIsValid ||
    (!allClasses &&
      (!classIds.length ||
        classIds.some((id) => !Number.isSafeInteger(id) || id <= 0)))
  ) {
    return 'Lengkapi judul, deskripsi, tanggal, dan target kelas kegiatan.'
  }
  return null
}

export async function fetchSchoolEventComments(
  eventId: number,
): Promise<EventCommentsResult> {
  if (!Number.isSafeInteger(eventId) || eventId <= 0) {
    return { status: 'error', message: 'ID kegiatan tidak valid.' }
  }

  try {
    const supabase = createClient()
    const { data, error } = await supabase.rpc('get_event_comments', {
      p_event_id: eventId,
    })

    if (error) {
      return {
        status: 'error',
        message:
          error.code === '42501'
            ? 'Kegiatan ini tidak tersedia untuk akun Anda.'
            : 'Komentar belum dapat dimuat. Periksa koneksi lalu coba lagi.',
      }
    }

    const comments = parseSchoolEventComments(data)
    if (!comments) {
      return {
        status: 'error',
        message: 'Format komentar dari server tidak valid.',
      }
    }

    return { status: 'success', comments }
  } catch {
    return {
      status: 'error',
      message: 'Komentar belum dapat dimuat. Periksa koneksi lalu coba lagi.',
    }
  }
}

export async function addSchoolEventComment(
  eventId: number,
  comment: string,
): Promise<EventMutationResult> {
  const normalizedComment = comment.trim()
  if (
    !Number.isSafeInteger(eventId) ||
    eventId <= 0 ||
    !normalizedComment ||
    normalizedComment.length > 2000
  ) {
    return { status: 'error', message: 'Komentar wajib diisi (maksimal 2.000 karakter).' }
  }

  try {
    const supabase = createClient()
    const { data, error } = await supabase.rpc('add_event_comment', {
      p_event_id: eventId,
      p_comment: normalizedComment,
    })

    if (error) {
      return {
        status: 'error',
        message:
          error.code === '42501'
            ? 'Anda tidak dapat berkomentar pada kegiatan ini.'
            : error.code === '22023'
              ? 'Komentar tidak boleh kosong.'
              : 'Komentar belum berhasil dikirim. Periksa koneksi lalu coba lagi.',
      }
    }
    if (!isSuccessResponse(data)) {
      return {
        status: 'error',
        message: 'Server tidak mengonfirmasi pengiriman komentar.',
      }
    }

    return { status: 'success', message: 'Komentar berhasil dikirim.' }
  } catch {
    return {
      status: 'error',
      message: 'Komentar belum berhasil dikirim. Periksa koneksi lalu coba lagi.',
    }
  }
}

export async function createSchoolEvent(input: {
  title: string
  description: string
  allClasses: boolean
  classIds: number[]
  eventDate: string
  image: File | null
}): Promise<EventMutationResult> {
  const validationError = validateEventInput(
    input.title,
    input.description,
    input.allClasses,
    input.classIds,
    input.eventDate,
  )
  if (validationError) return { status: 'error', message: validationError }

  if (
    input.image &&
    (!['image/jpeg', 'image/png', 'image/webp'].includes(input.image.type) ||
      input.image.size > 5 * 1024 * 1024)
  ) {
    return {
      status: 'error',
      message: 'Gambar harus JPEG, PNG, atau WebP dengan ukuran maksimal 5 MB.',
    }
  }

  try {
    const supabase = createClient()
    const { data: userData, error: userError } = await supabase.auth.getUser()
    if (userError || !userData.user) {
      return {
        status: 'error',
        message: 'Sesi login tidak valid. Silakan masuk kembali.',
      }
    }

    let imagePath: string | null = null
    if (input.image) {
      const extensionByMime: Record<string, string> = {
        'image/jpeg': 'jpg',
        'image/png': 'png',
        'image/webp': 'webp',
      }
      const extension = extensionByMime[input.image.type]
      imagePath = `${userData.user.id}/${crypto.randomUUID()}.${extension}`

      const { error: uploadError } = await supabase.storage
        .from('school-events')
        .upload(imagePath, input.image, {
          contentType: input.image.type,
          upsert: false,
        })

      if (uploadError) {
        return {
          status: 'error',
          message: 'Gambar kegiatan belum berhasil diunggah. Periksa akses penyimpanan.',
        }
      }
    }

    const { data, error } = await supabase.rpc('create_event', {
      p_title: input.title.trim(),
      p_description: input.description.trim(),
      p_all_classes: input.allClasses,
      p_class_ids: input.allClasses ? [] : input.classIds,
      p_event_date: input.eventDate,
      p_image_path: imagePath,
    })

    if (error || !isSuccessResponse(data)) {
      let cleanupFailure: string | null = null
      if (imagePath) {
        const { error: removeError } = await supabase.storage
          .from('school-events')
          .remove([imagePath])
        if (removeError) cleanupFailure = ' Gambar sementara juga belum dapat dibersihkan.'
      }

      return {
        status: 'error',
        message:
          error?.code === '42501'
            ? `Hanya admin atau guru yang dapat membuat kegiatan.${cleanupFailure ?? ''}`
            : error?.code === '22023'
              ? `Data kegiatan atau target kelas tidak valid.${cleanupFailure ?? ''}`
              : `Kegiatan belum berhasil dipublikasikan.${cleanupFailure ?? ''}`,
      }
    }

    return { status: 'success', message: 'Kegiatan berhasil dipublikasikan.' }
  } catch {
    return {
      status: 'error',
      message: 'Kegiatan belum berhasil dipublikasikan. Periksa koneksi lalu coba lagi.',
    }
  }
}

export async function deleteSchoolEvent(
  eventId: number,
  imagePath: string | null,
): Promise<EventMutationResult> {
  if (!Number.isSafeInteger(eventId) || eventId <= 0) {
    return { status: 'error', message: 'ID kegiatan tidak valid.' }
  }

  try {
    const supabase = createClient()
    const { data, error } = await supabase.rpc('delete_event', {
      p_event_id: eventId,
    })

    if (error || !isSuccessResponse(data)) {
      return {
        status: 'error',
        message:
          error?.code === '42501'
            ? 'Anda tidak berhak menghapus kegiatan ini.'
            : error?.code === 'P0002'
              ? 'Kegiatan sudah tidak tersedia.'
              : 'Kegiatan belum berhasil dihapus. Periksa koneksi lalu coba lagi.',
      }
    }

    if (imagePath) {
      const { error: removeError } = await supabase.storage
        .from('school-events')
        .remove([imagePath])
      if (removeError) {
        return {
          status: 'success',
          message: 'Kegiatan dihapus, tetapi gambar lama belum dapat dibersihkan.',
        }
      }
    }

    return { status: 'success', message: 'Kegiatan berhasil dihapus.' }
  } catch {
    return {
      status: 'error',
      message: 'Kegiatan belum berhasil dihapus. Periksa koneksi lalu coba lagi.',
    }
  }
}
