import { createClient } from '@/lib/supabase/server'

import {
  parseSchoolEventClasses,
  parseSchoolEvents,
  type SchoolEvent,
  type SchoolEventClass,
} from './event-types'

export type EventsPageData = {
  events: SchoolEvent[]
  classes: SchoolEventClass[]
  imageWarning: string | null
}

export type EventsPageResult =
  | { status: 'success'; data: EventsPageData }
  | { status: 'error'; message: string }

export async function getEventsPageData(
  canManageEvents: boolean,
): Promise<EventsPageResult> {
  const supabase = await createClient()
  const [eventsResult, classesResult] = await Promise.all([
    supabase.rpc('get_events'),
    canManageEvents
      ? supabase
          .from('kelas')
          .select('id, nama')
          .eq('aktif', true)
          .order('nama')
      : Promise.resolve(null),
  ])

  if (eventsResult.error) {
    return {
      status: 'error',
      message:
        eventsResult.error.code === '42501'
          ? 'Informasi kegiatan hanya tersedia untuk akun sekolah aktif.'
          : 'Informasi kegiatan belum dapat dimuat. Periksa koneksi lalu coba lagi.',
    }
  }

  const events = parseSchoolEvents(eventsResult.data)
  if (!events) {
    return {
      status: 'error',
      message: 'Format informasi kegiatan dari server tidak valid.',
    }
  }

  let classes: SchoolEventClass[] = []
  if (classesResult) {
    if (classesResult.error) {
      return {
        status: 'error',
        message: 'Daftar kelas belum dapat dimuat untuk pembuatan kegiatan.',
      }
    }

    const parsedClasses = parseSchoolEventClasses(classesResult.data)
    if (!parsedClasses) {
      return {
        status: 'error',
        message: 'Format daftar kelas dari server tidak valid.',
      }
    }
    classes = parsedClasses
  }

  const imagePaths = Array.from(
    new Set(
      events
        .map((event) => event.gambar_url)
        .filter((path): path is string => path !== null),
    ),
  )

  let imageWarning: string | null = null
  if (imagePaths.length) {
    const { data: signedImages, error: signedImagesError } = await supabase.storage
      .from('school-events')
      .createSignedUrls(imagePaths, 3600)

    if (signedImagesError) {
      imageWarning = 'Sebagian gambar kegiatan belum dapat ditampilkan.'
    } else {
      const signedUrlByPath = new Map(
        (signedImages ?? [])
          .filter(
            (image): image is typeof image & { path: string; signedUrl: string } =>
              typeof image.path === 'string' &&
              typeof image.signedUrl === 'string',
          )
          .map((image) => [image.path, image.signedUrl]),
      )
      for (const event of events) {
        if (event.gambar_url) {
          event.gambar_signed_url =
            signedUrlByPath.get(event.gambar_url) ?? null
        }
      }
      if (events.some((event) => event.gambar_url && !event.gambar_signed_url)) {
        imageWarning = 'Sebagian gambar kegiatan tidak dapat diakses.'
      }
    }
  }

  return {
    status: 'success',
    data: { events, classes, imageWarning },
  }
}
